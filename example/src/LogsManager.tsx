export enum LogType {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  RESPONSE = 'RESPONSE',
  CUSTOMER_ID = 'CUSTOMER_ID',
  /** Anything written with console.* (includes the ReactAmwalPay library's own logs). */
  CONSOLE = 'CONSOLE',
}

export interface LogEntry {
  id: string;
  message: string;
  type: LogType;
  timestamp: Date;
}

type Listener = () => void;

const MAX_ENTRIES = 3000;

/**
 * Masks secrets so exported logs can be shared freely by QC:
 * session tokens (JWE/JWT), secureHash values and the like keep only their
 * first 6 characters, which is still enough to correlate runs.
 */
export function redact(text: string): string {
  return (
    text
      // "sessionToken":"…", secureHash: '…', sessionToken=…
      .replace(
        /((?:session_?token|secure_?hash|authorization|access_?token|token)["']?\s*[:=]\s*["']?)([^"',\s}]{8,})/gi,
        (_m, key: string, value: string) =>
          `${key}${value.slice(0, 6)}…[masked]`
      )
      // Any remaining JWT / JWE looking string (eyJ… with 2+ dots).
      .replace(
        /\beyJ[\w-]{4,}(?:\.[\w-]*){2,4}/g,
        (m) => `${m.slice(0, 6)}…[masked]`
      )
      // 64-hex secure hashes.
      .replace(/\b[0-9a-fA-F]{64}\b/g, (m) => `${m.slice(0, 6)}…[masked]`)
  );
}

class LogsManagerClass {
  private logs: LogEntry[] = [];
  private listeners: Listener[] = [];
  private notifyScheduled = false;

  addLog(message: string, type: LogType) {
    const entry: LogEntry = {
      id: Math.random().toString(36).slice(2),
      message: redact(message),
      type,
      timestamp: new Date(),
    };
    this.logs = [entry, ...this.logs];
    if (this.logs.length > MAX_ENTRIES) {
      this.logs = this.logs.slice(0, MAX_ENTRIES);
    }
    this.scheduleNotify();
  }

  getLogs(): LogEntry[] {
    return this.logs;
  }

  /**
   * Renders every captured log as plain text, oldest first, so it can be
   * shared / copied out of the device. `header` is prepended verbatim and is
   * used to carry the SDK configuration the logs belong to.
   */
  exportAsText(header?: string): string {
    const body = [...this.logs]
      .reverse()
      .map(
        (log) =>
          `[${log.timestamp.toISOString()}] ${log.type.padEnd(11)} ${log.message}`
      )
      .join('\n');

    return header ? `${header}\n\n${body}` : body;
  }

  clearLogs() {
    this.logs = [];
    this.scheduleNotify();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Listeners update React state. console.* is captured too, and React itself
   * logs during render, so notifying synchronously could set state mid-render
   * (and loop through console.error). Batch to the next tick instead.
   */
  private scheduleNotify() {
    if (this.notifyScheduled) return;
    this.notifyScheduled = true;
    setTimeout(() => {
      this.notifyScheduled = false;
      this.listeners.forEach((l) => l());
    }, 0);
  }
}

export const LogsManager = new LogsManagerClass();
