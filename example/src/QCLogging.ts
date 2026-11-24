/**
 * QC log capture for the example app (installed from index.js, before the app
 * renders). Collects everything a tester needs to report an Apple Pay problem
 * without Xcode:
 *
 *  - every console.* call (the ReactAmwalPay library logs its session-token
 *    and config steps this way),
 *  - uncaught JS errors and unhandled promise rejections,
 *  - native iOS output via NativeModules.QCLogCapture (SDK stdout/stderr and
 *    PassKit system-log errors) — fetched when the report is exported.
 *
 * All text goes through LogsManager.redact(), so tokens and hashes are masked.
 */
import { NativeModules, Platform } from 'react-native';
import { LogsManager, LogType, redact } from './LogsManager';

type NativeLogs = { console: string[]; system: string[]; systemError?: string };

const QCLogCapture: {
  getNativeLogs(): Promise<NativeLogs>;
  getApplePayDiagnostics(): Promise<Record<string, unknown>>;
  clearNativeLogs(): void;
} | null = Platform.OS === 'ios' ? (NativeModules.QCLogCapture ?? null) : null;

let installed = false;
let inConsoleHook = false;

function stringify(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value instanceof Error) {
    return `${value.name}: ${value.message}${value.stack ? `\n${value.stack}` : ''}`;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function installQCLogging() {
  if (installed) return;
  installed = true;

  // 1. console.* -> LogsManager (originals still run, so Metro/Xcode keep working).
  const levels: Array<[keyof Console, LogType]> = [
    ['log', LogType.CONSOLE],
    ['info', LogType.CONSOLE],
    ['debug', LogType.CONSOLE],
    ['warn', LogType.WARN],
    ['error', LogType.ERROR],
  ];
  for (const [level, type] of levels) {
    const original = (console[level] as (...a: unknown[]) => void).bind(
      console
    );
    (console as any)[level] = (...args: unknown[]) => {
      original(...args);
      if (inConsoleHook) return; // never recurse
      inConsoleHook = true;
      try {
        LogsManager.addLog(args.map(stringify).join(' '), type);
      } finally {
        inConsoleHook = false;
      }
    };
  }

  // 2. Uncaught JS errors (keeps the default red box / crash behaviour).
  const errorUtils = (global as any).ErrorUtils;
  if (errorUtils?.getGlobalHandler) {
    const previous = errorUtils.getGlobalHandler();
    errorUtils.setGlobalHandler((error: unknown, isFatal?: boolean) => {
      LogsManager.addLog(
        `Uncaught JS ${isFatal ? 'FATAL ' : ''}error: ${stringify(error)}`,
        LogType.ERROR
      );
      previous?.(error, isFatal);
    });
  }

  // 3. Unhandled promise rejections. In __DEV__ React Native already reports
  //    them through console.warn (captured above); release builds have no
  //    tracker at all, so add one there.
  const hermes = (global as any).HermesInternal;
  if (!__DEV__ && hermes?.enablePromiseRejectionTracker) {
    hermes.enablePromiseRejectionTracker({
      allRejections: true,
      onUnhandled: (_id: number, rejection: unknown) =>
        LogsManager.addLog(
          `Unhandled promise rejection: ${stringify(rejection)}`,
          LogType.ERROR
        ),
    });
  }

  LogsManager.addLog(
    `QC logging installed (${Platform.OS} ${Platform.Version}, ${
      __DEV__ ? 'debug' : 'release'
    } JS, native capture: ${QCLogCapture ? 'yes' : 'no'})`,
    LogType.INFO
  );
}

/** Known failure signatures -> a short hint for whoever reads the report. */
const HINTS: Array<[RegExp, string]> = [
  [
    /Failed to present payment controller|Failed to present in-app payment interface|Interface is currently active/i,
    'Apple Pay sheet could not be presented. Known SDK issue: the payment request is sent twice (bug-051); also check run target is a real device and the merchant ID is in profileMerchantIds.',
  ],
  [
    /APGEX/i,
    'Backend (Amwal gateway) rejected the payment — send the trace id to the backend team.',
  ],
  [
    /not available on this device/i,
    'Apple Pay unavailable: no supported card in Wallet (see canMakePaymentsWithSdkNetworks).',
  ],
  [/cancel/i, 'User cancelled the Apple Pay sheet.'],
];

export function hintFor(text: string): string | undefined {
  return HINTS.find(([re]) => re.test(text))?.[1];
}

/**
 * Logs an SDK onResponse payload with a clear SUCCESS / CANCELLED / ERROR
 * classification so failures stand out in the viewer and the export.
 */
export function logSdkResponse(response: unknown) {
  let parsed: any = response;
  if (typeof response === 'string') {
    try {
      parsed = JSON.parse(response);
    } catch {
      parsed = response;
    }
  }
  const text = stringify(parsed);
  const status = String(
    parsed?.status ?? parsed?.transactionStatus ?? ''
  ).toLowerCase();
  const isError =
    parsed?.error != null ||
    /error|fail|declin|reject/.test(status) ||
    (typeof parsed === 'string' && /error|fail/i.test(parsed));
  const isCancel =
    /cancel/.test(status) || /cancel/i.test(String(parsed?.reason ?? ''));

  const label = isError ? 'ERROR' : isCancel ? 'CANCELLED' : 'OK';
  LogsManager.addLog(
    `Payment Response [${label}]: ${text}`,
    isError ? LogType.ERROR : LogType.RESPONSE
  );
  const hint = (isError || isCancel) && hintFor(text);
  if (hint) LogsManager.addLog(`HINT: ${hint}`, LogType.WARN);
}

/** Marks the start of a payment attempt so native lines can be correlated. */
export function markPaymentStart(summary: string) {
  LogsManager.addLog(
    `===== PAYMENT ATTEMPT ${new Date().toISOString()} ===== ${summary}`,
    LogType.INFO
  );
}

export function clearAllLogs() {
  LogsManager.clearLogs();
  QCLogCapture?.clearNativeLogs();
}

/** Full plain-text report: header, Apple Pay diagnostics, JS logs, native logs. */
export async function buildQCReport(header: string): Promise<string> {
  const sections: string[] = [header];

  if (QCLogCapture) {
    try {
      const diag = await QCLogCapture.getApplePayDiagnostics();
      sections.push(
        '===== APPLE PAY DIAGNOSTICS =====\n' +
          Object.entries(diag)
            .map(([k, v]) => `${k}: ${String(v)}`)
            .join('\n')
      );
    } catch (e) {
      sections.push(
        `===== APPLE PAY DIAGNOSTICS =====\nfailed: ${stringify(e)}`
      );
    }
  }

  sections.push(
    '===== APP / JS LOGS (oldest first) =====\n' + LogsManager.exportAsText()
  );

  if (QCLogCapture) {
    try {
      const native = await QCLogCapture.getNativeLogs();
      const systemErrors = native.system.filter((l) =>
        /\[(ERROR|FAULT)\]/.test(l)
      );
      const hints = new Set(
        [...native.console, ...native.system]
          .map(hintFor)
          .filter(Boolean) as string[]
      );
      if (hints.size > 0) {
        sections.push(
          '===== HINTS FROM NATIVE LOGS =====\n' +
            [...hints].map((h) => `- ${h}`).join('\n')
        );
      }
      sections.push(
        `===== iOS SYSTEM LOG: errors only (${systemErrors.length}) =====\n` +
          (native.systemError ?? (systemErrors.join('\n') || '(none)'))
      );
      sections.push(
        `===== NATIVE CONSOLE: SDK stdout/stderr (${native.console.length}) =====\n` +
          (native.console.join('\n') || '(none)')
      );
      sections.push(
        `===== iOS SYSTEM LOG: payment related (${native.system.length}) =====\n` +
          (native.system.join('\n') || '(none)')
      );
    } catch (e) {
      sections.push(`===== NATIVE LOGS =====\nfailed: ${stringify(e)}`);
    }
  }

  return redact(sections.join('\n\n'));
}
