export class LastLocationTracker {
    private lastFilePath: string | null = null;
    private lastModule: string | null = null;

    public updateLocation(filePath: string | null, module: string | null): void {
        this.lastFilePath = filePath;
        this.lastModule = module;
    }

    public getLastFilePath(): string | null {
        return this.lastFilePath;
    }

    public getLastModule(): string | null {
        return this.lastModule;
    }

    public clear(): void {
        this.lastFilePath = null;
        this.lastModule = null;
    }
} 