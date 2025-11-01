import { JSONConverter } from './JSONConverter';
import { TimeService } from '../time/TimeService';
import { ModuleManager } from '../config/ModuleManager';
import * as fs from 'fs';
import * as path from 'path';

export class MessageQueue {
    private jsonConverter = new JSONConverter();

    constructor(
        private timeService: TimeService,
        private moduleManager: ModuleManager,
        private activeFlowFile: string
    ) {
        // Ensure directory exists
        fs.mkdirSync(path.dirname(activeFlowFile), { recursive: true });
    }

    public pushEditorActivity(
        durationInSeconds: number,
        filePath: string,
        module: string | undefined,
        isModified: boolean
    ): void;
    public pushEditorActivity(
        durationInSeconds: number,
        endTime: Date,
        filePath: string,
        module: string | undefined,
        isModified: boolean
    ): void;
    public pushEditorActivity(
        durationInSeconds: number,
        endTimeOrFilePath: Date | string,
        filePathOrModule: string,
        moduleOrModified: string | undefined | boolean,
        isModified?: boolean
    ): void {
        const isEndTimeVersion = endTimeOrFilePath instanceof Date;
        
        const endTime = isEndTimeVersion ? endTimeOrFilePath : this.timeService.now();
        const filePath = isEndTimeVersion ? filePathOrModule : endTimeOrFilePath;
        const module = isEndTimeVersion ? moduleOrModified as string | undefined : filePathOrModule;
        const modified = isEndTimeVersion ? isModified : moduleOrModified as boolean;

        if (!module || this.moduleManager.isModuleEnabled(module)) {
            const activity = {
                durationInSeconds: Math.round(durationInSeconds),
                endTime,
                module,
                filePath,
                modified
            };
            this.writeMessage('EditorActivity', activity);
        }
    }

    public pushModificationActivity(durationInSeconds: number, modificationCount: number): void {
        const activity = {
            durationInSeconds: Math.round(durationInSeconds),
            endTime: this.timeService.now(),
            modificationCount
        };
        this.writeMessage('ModificationActivity', activity);
    }

    public pushExecutionActivity(
        durationInSeconds: number,
        processName: string,
        exitCode: number,
        executionTaskType: string,
        isDebug: boolean
    ): void {
        const activity = {
            durationInSeconds: Math.round(durationInSeconds),
            endTime: this.timeService.now(),
            processName,
            exitCode,
            executionTaskType,
            debug: isDebug
        };
        this.writeMessage('ExecutionActivity', activity);
    }

    public pushExternalActivity(durationInSeconds: number, comment: string): void {
        const activity = {
            durationInSeconds: Math.round(durationInSeconds),
            endTime: this.timeService.now(),
            comment
        };
        this.writeMessage('ExternalActivity', activity);
    }

    public pushEvent(eventType: string, message: string): void {
        const event = {
            type: eventType,
            position: this.timeService.now(),
            comment: message
        };
        this.writeMessage('Event', event);
    }

    public flush(): void {
        // No-op: The FlowPublisher will handle committing the active file
    }

    private writeMessage(_type: string, data: any): void {
        const message = `${this.jsonConverter.toJSON(data)}\n`;
        fs.appendFileSync(this.activeFlowFile, message);
    }
} 