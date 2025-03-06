export class Logger {
    debug(message: string): void {
        console.log(`[DEBUG] ${message}`);
    }

    info(message: string): void {
        console.log(`[INFO] ${message}`);
    }

    warn(message: string): void {
        console.warn(`[WARN] ${message}`);
    }

    error(message: string, error?: Error): void {
        console.error(`[ERROR] ${message}`, error);
    }
} 