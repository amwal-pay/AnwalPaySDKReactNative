export enum LogType {
  RESPONSE = 'response',
  CANCELLED = 'cancelled',
  CUSTOMER_ID = 'customerId',
  ERROR = 'error',
  INFO = 'info',
  DEBUG = 'debug',
}

export interface LogEntry {
  id: string;
  message: string;
  type: LogType;
  timestamp: Date;
}

class LogsManagerClass {
  private logs: LogEntry[] = [];
  private listeners: ((logs: LogEntry[]) => void)[] = [];

  addLog(message: string, type: LogType): void {
    const entry: LogEntry = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      message,
      type,
      timestamp: new Date(),
    };

    this.logs.push(entry);
    this.notifyListeners();
  }

  clearLogs(): void {
    this.logs = [];
    this.notifyListeners();
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  subscribe(listener: (logs: LogEntry[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener([...this.logs]));
  }
}

export const LogsManager = new LogsManagerClass();
