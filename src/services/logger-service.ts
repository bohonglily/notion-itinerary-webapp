export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  error?: Error;
}

export class LoggerService {
  private static instance: LoggerService;
  private logLevel: LogLevel;
  private isDevelopment: boolean;

  private constructor() {
    this.logLevel = import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.INFO;
    this.isDevelopment = import.meta.env.DEV;
  }

  static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private formatMessage(level: LogLevel, category: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    let formattedMessage = `[${timestamp}] [${levelName}] [${category}] ${message}`;
    
    if (data && this.isDevelopment) {
      formattedMessage += `\nData: ${JSON.stringify(data, null, 2)}`;
    }
    
    return formattedMessage;
  }

  private log(level: LogLevel, category: string, message: string, data?: any, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      error
    };

    const formattedMessage = this.formatMessage(level, category, message, data);

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage, data);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, data);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, data, error);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage, data, error);
        break;
    }

    // 在生產環境中，可以將日誌發送到外部服務
    if (!this.isDevelopment && level >= LogLevel.ERROR) {
      this.sendToExternalService(logEntry);
    }
  }

  private sendToExternalService(logEntry: LogEntry): void {
    // 這裡可以實作發送日誌到外部服務的邏輯
    // 例如：Sentry, LogRocket, 或自定義的日誌收集服務
  }

  debug(category: string, message: string, data?: any): void {
    this.log(LogLevel.DEBUG, category, message, data);
  }

  info(category: string, message: string, data?: any): void {
    this.log(LogLevel.INFO, category, message, data);
  }

  warn(category: string, message: string, data?: any, error?: Error): void {
    this.log(LogLevel.WARN, category, message, data, error);
  }

  error(category: string, message: string, data?: any, error?: Error): void {
    this.log(LogLevel.ERROR, category, message, data, error);
  }

  // 特定功能的便利方法
  apiRequest(method: string, url: string, data?: any): void {
    this.debug('API', `${method} ${url}`, data);
  }

  apiResponse(method: string, url: string, status: number, data?: any): void {
    if (status >= 400) {
      this.error('API', `${method} ${url} failed with status ${status}`, data);
    } else {
      this.debug('API', `${method} ${url} succeeded with status ${status}`, data);
    }
  }

  apiError(method: string, url: string, error: Error): void {
    this.error('API', `${method} ${url} error`, { error: error.message }, error);
  }

  userAction(action: string, data?: any): void {
    this.info('USER', action, data);
  }

  systemEvent(event: string, data?: any): void {
    this.info('SYSTEM', event, data);
  }

  performance(operation: string, duration: number, data?: any): void {
    this.debug('PERFORMANCE', `${operation} took ${duration}ms`, data);
  }
}

export const logger = LoggerService.getInstance();