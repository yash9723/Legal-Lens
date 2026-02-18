
import { collection, addDoc, serverTimestamp } from "./firebase";
import { db, auth } from "./firebase";

export type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'success';
export type LogCategory = 'auth' | 'ai' | 'ui' | 'system' | 'network' | 'visual' | 'tools';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: any;
}

class LoggerService {
  private logs: LogEntry[] = [];
  private listeners: ((logs: LogEntry[]) => void)[] = [];
  private readonly MAX_LOGS = 150;
  private isDbReady = false;

  constructor() {
    // We are using a mock Firebase implementation, so the DB is always "ready"
    // to accept logs (which are just printed to console in the mock).
    this.isDbReady = true;
  }

  // Safe object sanitizer to prevent circular refs and reduce size
  private sanitizeData(data: any): any {
    if (!data) return undefined;

    // If it's too large (e.g. base64 image), truncate it
    try {
      const str = JSON.stringify(data);
      if (str.length > 5000) {
        return { summary: "Data truncated (too large)", preview: str.substring(0, 200) + "..." };
      }
      return JSON.parse(str);
    } catch (e) {
      return { error: "Data could not be serialized" };
    }
  }

  private async persistToCloud(entry: LogEntry) {
    if (!this.isDbReady) return;

    // Only push significant events to Firestore to save writes/quota
    // e.g., Errors, Warnings, or specific Analysis events
    if (entry.level === 'debug') return;

    try {
      const user = auth.currentUser;
      await addDoc(collection(db, "system_logs"), {
        ...entry,
        uid: user ? user.uid : 'anonymous',
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.warn("Failed to push log to Firestore", e);
    }
  }

  private addEntry(level: LogLevel, category: LogCategory, message: string, data?: any) {
    const entry: LogEntry = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data: this.sanitizeData(data)
    };

    this.logs.push(entry);

    // Trim in memory
    if (this.logs.length > this.MAX_LOGS + 20) {
      this.logs = this.logs.slice(-this.MAX_LOGS);
    }

    // Console output 
    const timestamp = new Date().toLocaleTimeString();
    const prefix = `[${timestamp}] [${category.toUpperCase()}]`;

    let style = 'color: #3b82f6';
    if (level === 'error') style = 'color: #ef4444; font-weight: bold';
    else if (level === 'warn') style = 'color: #f97316';
    else if (level === 'success') style = 'color: #22c55e';
    else if (level === 'debug') style = 'color: #94a3b8';
    else if (category === 'visual') style = 'color: #a855f7; font-weight: bold';

    if (data) {
      console.log(`%c${prefix} ${message}`, style, data);
    } else {
      console.log(`%c${prefix} ${message}`, style);
    }

    this.persistToCloud(entry);
    this.notify();
  }

  private notify() {
    this.listeners.forEach(l => l([...this.logs]));
  }

  public subscribe(listener: (logs: LogEntry[]) => void) {
    this.listeners.push(listener);
    listener([...this.logs]);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public getLogs() {
    return [...this.logs];
  }

  public clear() {
    this.logs = [];
    this.notify();
  }

  public info(category: LogCategory, message: string, data?: any) {
    this.addEntry('info', category, message, data);
  }

  public success(category: LogCategory, message: string, data?: any) {
    this.addEntry('success', category, message, data);
  }

  public warn(category: LogCategory, message: string, data?: any) {
    this.addEntry('warn', category, message, data);
  }

  public error(category: LogCategory, message: string, error?: any) {
    let errorData = error;
    if (error instanceof Error) {
      errorData = {
        message: error.message,
        stack: error.stack,
        name: error.name
      };
    }
    this.addEntry('error', category, message, errorData);
  }

  public debug(category: LogCategory, message: string, data?: any) {
    this.addEntry('debug', category, message, data);
  }

  public visual(message: string, data?: any) {
    this.addEntry('info', 'visual', message, data);
  }
}

export const logger = new LoggerService();
