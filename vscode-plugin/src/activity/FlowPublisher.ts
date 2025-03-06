import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../Logger';
import { TimeService } from '../time/TimeService';
import { JSONConverter } from './JSONConverter';

export class FlowPublisher {
    private static readonly BATCH_PUBLISH_FREQUENCY_MS = 30000;
    private static readonly FILE_MODIFIER = '.' + Math.random().toString(36).substring(2);
    
    private closed = false;
    private publishThread?: NodeJS.Timeout;
    private jsonConverter = new JSONConverter();
    private failedFileToLastDayRetriedMap = new Map<string, number>();
    private publishingLock: PublishingLock;

    constructor(
        private baseDir: string,
        private logger: Logger,
        private timeService: TimeService
    ) {
        this.publishingLock = new PublishingLock(logger, baseDir);
        this.setupDirectories();
    }

    private setupDirectories() {
        fs.mkdirSync(this.publishDir, { recursive: true });
        fs.mkdirSync(this.failedDir, { recursive: true });
        fs.mkdirSync(this.retryNextSessionDir, { recursive: true });
    }

    public start(): void {
        this.commitActiveFile();

        // Move retry files to publish directory
        for (const file of fs.readdirSync(this.retryNextSessionDir)) {
            this.moveFileToDir(
                path.join(this.retryNextSessionDir, file),
                this.publishDir
            );
        }

        if (!this.publishThread) {
            this.publishThread = setInterval(() => this.publishLoop(), FlowPublisher.BATCH_PUBLISH_FREQUENCY_MS);
        }
    }

    public flush(): void {
        this.failedFileToLastDayRetriedMap.clear();
        if (this.publishThread) {
            clearInterval(this.publishThread);
            this.publishThread = undefined;
        }
    }

    public close(): void {
        this.closed = true;
        this.flush();
    }

    private async publishLoop(): Promise<void> {
        if (this.closed) return;

        if (this.hasSomethingToPublish()) {
            await this.acquireLockAndPublishBatches();
        }
    }

    private hasSomethingToPublish(): boolean {
        return this.getBatchesToPublish().length > 0;
    }

    private getBatchesToPublish(): string[] {
        const batchesToPublish: string[] = [];
        const currentDay = this.timeService.now().getDate();

        for (const file of fs.readdirSync(this.publishDir)) {
            const fullPath = path.join(this.publishDir, file);
            const lastDayRetried = this.failedFileToLastDayRetriedMap.get(fullPath);

            if (!lastDayRetried || lastDayRetried !== currentDay) {
                batchesToPublish.push(fullPath);
            }
        }

        return batchesToPublish;
    }

    private async acquireLockAndPublishBatches(): Promise<void> {
        if (await this.publishingLock.acquire()) {
            try {
                for (const batchFile of this.getBatchesToPublish()) {
                    await this.convertPublishAndDeleteBatch(batchFile);
                }
            } catch (error) {
                this.logger.error('Unhandled error during batch file publishing...', error as Error);
            } finally {
                this.publishingLock.release();
            }
        }
    }

    private async convertPublishAndDeleteBatch(batchFile: string): Promise<void> {
        try {
            const batch = await this.convertBatchFileToObject(batchFile);
            if (!batch.isEmpty()) {
                await this.publishBatch(batch);
            }
            fs.unlinkSync(batchFile);
        } catch (error) {
            const errorMessage = (error as Error).message;
            if (errorMessage.includes('404')) {
                this.moveFileToDir(batchFile, this.retryNextSessionDir);
                this.logger.info(`Failed to publish ${batchFile} due to missing task, will retry in future session...`);
            } else {
                this.failedFileToLastDayRetriedMap.set(batchFile, this.timeService.now().getDate());
                this.moveFileToDir(batchFile, this.failedDir);
                this.logger.info(`Failed to publish ${batchFile}, exception=${errorMessage}, will retry tomorrow...`);
            }
        }
    }

    private async convertBatchFileToObject(batchFile: string): Promise<FlowBatch> {
        const batch = new FlowBatch(this.timeService.now());
        const content = fs.readFileSync(batchFile, 'utf8');
        
        for (const line of content.split('\n')) {
            if (line.trim()) {
                const [type, jsonContent] = line.split('=');
                batch.addActivity(type, JSON.parse(jsonContent));
            }
        }
        
        return batch;
    }

    private commitActiveFile(): void {
        if (fs.existsSync(this.activeFile)) {
            const dateTime = this.formatDateTime(this.timeService.now());
            this.moveFileToDirAndRename(this.activeFile, this.publishDir, dateTime);
        }
    }

    private get activeFile(): string {
        return path.join(this.baseDir, 'active.flow');
    }

    private get publishDir(): string {
        return path.join(this.baseDir, 'publish');
    }

    private get failedDir(): string {
        return path.join(this.baseDir, 'failed');
    }

    private get retryNextSessionDir(): string {
        return path.join(this.baseDir, 'retryNextSession');
    }

    private moveFileToDir(file: string, dir: string): string {
        return this.moveFileToDirAndRename(file, dir, path.basename(file));
    }

    private moveFileToDirAndRename(file: string, dir: string, newName: string): string {
        const target = path.join(dir, newName + FlowPublisher.FILE_MODIFIER);
        fs.renameSync(file, target);
        return target;
    }

    private formatDateTime(date: Date): string {
        return date.toISOString()
            .replace(/[-:]/g, '')
            .replace(/\..+/, '')
            .replace('T', '_');
    }

    private async publishBatch(batch: FlowBatch): Promise<void> {
        // TODO: Implement actual publishing logic when we have the server API
        this.logger.info(`Publishing batch with ${batch.getActivityCount()} activities`);
    }
}

class PublishingLock {
    private lockFile: string;
    private lockHandle?: number;

    constructor(private logger: Logger, baseDir: string) {
        this.lockFile = path.join(baseDir, 'publishing.lock');
    }

    async acquire(): Promise<boolean> {
        try {
            this.lockHandle = fs.openSync(this.lockFile, 'wx');
            fs.writeFileSync(this.lockHandle, Date.now().toString());
            return true;
        } catch (error) {
            return false;
        }
    }

    release(): void {
        try {
            if (this.lockHandle !== undefined) {
                fs.closeSync(this.lockHandle);
                fs.unlinkSync(this.lockFile);
                this.lockHandle = undefined;
            }
        } catch (error) {
            this.logger.error('Failed to release publishing lock', error as Error);
        }
    }
}

class FlowBatch {
    private activities: Array<{ type: string; data: any }> = [];

    constructor(private timeSent: Date) {}

    addActivity(type: string, data: any): void {
        this.activities.push({ type, data });
    }

    isEmpty(): boolean {
        return this.activities.length === 0;
    }

    getActivityCount(): number {
        return this.activities.length;
    }
} 