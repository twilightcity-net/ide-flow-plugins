import { MessageQueue } from './MessageQueue';
import { TimeService } from '../time/TimeService';
import { Duration } from '../time/Duration';

interface ProcessActivity {
    processName: string;
    executionTaskType: string;
    timeStarted: Date;
    isDebug: boolean;
}

interface FileActivity {
    module: string | undefined;
    filePath: string;
    time: Date;
    modified: boolean;
}

export class ActivityHandler {
    private static readonly SHORTEST_ACTIVITY = 3; // seconds
    
    private activeFileActivity: FileActivity | null = null;
    private modificationCount = 0;
    private recentIdleDuration: Duration | null = null;
    private activeProcessMap: Map<number, ProcessActivity> = new Map();

    constructor(
        private messageQueue: MessageQueue,
        private timeService: TimeService
    ) {}

    public markExternalActivity(idleDurationSeconds: number, comment: string): void {
        const idleDuration = new Duration(idleDurationSeconds);
        this.recentIdleDuration = idleDuration;

        if (idleDurationSeconds >= ActivityHandler.SHORTEST_ACTIVITY) {
            if (this.activeFileActivity) {
                const duration = this.getDurationSeconds(this.activeFileActivity.time) - idleDurationSeconds;
                if (duration > 0) {
                    const endTime = new Date(this.timeService.now().getTime() - (idleDurationSeconds * 1000));
                    this.messageQueue.pushEditorActivity(
                        Math.round(duration),
                        endTime,
                        this.activeFileActivity.filePath,
                        this.activeFileActivity.module,
                        this.activeFileActivity.modified
                    );
                }
            }
            
            this.messageQueue.pushExternalActivity(Math.round(idleDurationSeconds), comment);
            
            if (this.activeFileActivity) {
                this.activeFileActivity = this.createFileActivity(
                    this.activeFileActivity.module,
                    this.activeFileActivity.filePath
                );
            }
        }
    }

    public markProcessStarting(processId: number, processName: string, executionTaskType: string, isDebug: boolean): void {
        const processActivity: ProcessActivity = {
            processName,
            executionTaskType,
            timeStarted: this.timeService.now(),
            isDebug
        };
        this.activeProcessMap.set(processId, processActivity);
    }

    public markProcessEnding(processId: number, exitCode: number): void {
        const processActivity = this.activeProcessMap.get(processId);
        if (processActivity) {
            this.activeProcessMap.delete(processId);
            const durationSeconds = this.getDurationSeconds(processActivity.timeStarted);
            
            this.messageQueue.pushExecutionActivity(
                durationSeconds,
                processActivity.processName,
                exitCode,
                processActivity.executionTaskType,
                processActivity.isDebug
            );
        }
    }

    public startFileEvent(moduleName: string | undefined, filePath: string): void {
        if (this.isDifferentFile(filePath)) {
            if (this.isOverActivityThreshold()) {
                this.messageQueue.pushEditorActivity(
                    this.getDurationSeconds(this.activeFileActivity!.time),
                    this.activeFileActivity!.filePath,
                    this.activeFileActivity!.module,
                    this.activeFileActivity!.modified
                );
            }

            this.activeFileActivity = this.createFileActivity(moduleName, filePath);
        }
    }

    public endFileEvent(filePath: string | null): void {
        if (!filePath || this.isSameFile(filePath)) {
            this.startFileEvent(undefined, filePath || '');
        }
    }

    public fileModified(filePath: string): void {
        if (this.activeFileActivity && this.activeFileActivity.filePath === filePath) {
            this.activeFileActivity.modified = true;
        }
        this.modificationCount++;
    }

    public pushModificationActivity(intervalInSeconds: number): void {
        const modCount = this.modificationCount;
        this.modificationCount = 0;
        if (modCount > 0) {
            this.messageQueue.pushModificationActivity(intervalInSeconds, modCount);
        }
    }

    private createFileActivity(moduleName: string | undefined, filePath: string): FileActivity | null {
        return filePath ? {
            module: moduleName,
            filePath,
            time: this.timeService.now(),
            modified: false
        } : null;
    }

    private isDifferentFile(newFilePath: string): boolean {
        if (!this.activeFileActivity) {
            return !!newFilePath;
        }
        return this.activeFileActivity.filePath !== newFilePath;
    }

    private isSameFile(newFilePath: string): boolean {
        return !this.isDifferentFile(newFilePath);
    }

    private isOverActivityThreshold(): boolean {
        return !!this.activeFileActivity && 
               this.getDurationSeconds(this.activeFileActivity.time) >= ActivityHandler.SHORTEST_ACTIVITY;
    }

    private getDurationSeconds(startTime: Date): number {
        return Math.round((this.timeService.now().getTime() - startTime.getTime()) / 1000);
    }
} 