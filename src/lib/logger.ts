type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: Record<string, any>;
    userId?: string;
}

class Logger {
    private static instance: Logger;
    private isDev = import.meta.env.DEV;

    private constructor() { }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    private log(level: LogLevel, message: string, context?: Record<string, any>) {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            context,
            // userId could be injected if we wanted stateful logger, but keeping it simple
        };

        if (this.isDev) {
            const style = {
                info: 'color: #3b82f6', // blue
                warn: 'color: #eab308', // yellow
                error: 'color: #ef4444', // red
                debug: 'color: #a8a29e', // gray
            };
            console.log(`%c[${level.toUpperCase()}] ${message}`, style[level], context || '');
        } else {
            // In production, this would send to Sentry/Datadog/etc.
            // For now, we just console.log stringified JSON for log ingestion
            if (level === 'error') {
                console.error(JSON.stringify(entry));
            } else {
                console.log(JSON.stringify(entry));
            }
        }
    }

    public info(message: string, context?: Record<string, any>) {
        this.log('info', message, context);
    }

    public warn(message: string, context?: Record<string, any>) {
        this.log('warn', message, context);
    }

    public error(message: string, context?: Record<string, any>) {
        this.log('error', message, context);
    }

    public debug(message: string, context?: Record<string, any>) {
        this.log('debug', message, context);
    }
}

export const logger = Logger.getInstance();
