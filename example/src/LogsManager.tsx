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
