export enum LogType {
  INFO = 'INFO',
  ERROR = 'ERROR',
  RESPONSE = 'RESPONSE',
  CUSTOMER_ID = 'CUSTOMER_ID',
}

export interface LogEntry {
  id: string;
  message: string;
  type: LogType;
  timestamp: Date;
}

type Listener = () => void;

class LogsManagerClass {
  private logs: LogEntry[] = [];
  private listeners: Listener[] = [];

  addLog(message: string, type: LogType) {
    const entry: LogEntry = {
      id: Math.random().toString(36).slice(2),
      message,
      type,
      timestamp: new Date(),
    };
    this.logs = [entry, ...this.logs];
    this.listeners.forEach((l) => l());
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
    this.listeners.forEach((l) => l());
  }

  subscribe(listener: Listener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }
}

export const LogsManager = new LogsManagerClass();
