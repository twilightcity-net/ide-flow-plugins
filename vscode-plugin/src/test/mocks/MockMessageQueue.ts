import { MessageQueue } from '../../activity/MessageQueue';
import { TimeService } from '../../time/TimeService';
import { ModuleManager } from '../../config/ModuleManager';
import * as path from 'path';
import * as os from 'os';

interface EditorActivity {
    durationInSeconds: number;
    endTime: Date;
    module?: string;
    filePath: string;
    modified: boolean;
}

interface ExternalActivity {
    durationInSeconds: number;
    endTime: Date;
    comment: string;
}

interface ExecutionActivity {
    durationInSeconds: number;
    endTime: Date;
    processName: string;
    exitCode: number;
    executionTaskType: string;
    debug: boolean;
}

export class MockMessageQueue {
    public jsonConverter = { toJSON: () => '' };
    public timeService: TimeService;
    public moduleManager: ModuleManager;
    public activeFlowFile: string;
    
    editorActivities: EditorActivity[] = [];
    externalActivities: ExternalActivity[] = [];
    executionActivities: ExecutionActivity[] = [];

    constructor(timeService?: TimeService, moduleManager?: ModuleManager, activeFlowFile?: string) {
        this.timeService = timeService || new TimeService();
        this.moduleManager = moduleManager || new ModuleManager(path.join(os.homedir(), '.flow', 'plugins', 'com.microsoft.vscode'), {
            info: () => {},
            error: () => {},
            debug: () => {},
            warn: () => {}
        } as any);
        this.activeFlowFile = activeFlowFile || path.join(os.tmpdir(), 'test-active.flow');
    }

    pushEditorActivity(
        durationInSeconds: number,
        endTimeOrFilePath: Date | string,
        filePathOrModule: string,
        moduleOrModified?: string | boolean,
        isModified?: boolean
    ): void {
        const isEndTimeVersion = endTimeOrFilePath instanceof Date;
        const endTime = isEndTimeVersion ? endTimeOrFilePath : new Date();
        const filePath = isEndTimeVersion ? filePathOrModule : endTimeOrFilePath as string;
        const module = isEndTimeVersion ? moduleOrModified as string | undefined : filePathOrModule;
        const modified = isEndTimeVersion ? isModified : moduleOrModified as boolean;
        
        this.editorActivities.push({
            durationInSeconds,
            endTime,
            module,
            filePath,
            modified: modified || false
        });
    }

    pushModificationActivity(_durationInSeconds: number, _modificationCount: number): void {
        // No-op for tests
    }

    pushExternalActivity(durationInSeconds: number, comment: string): void {
        this.externalActivities.push({
            durationInSeconds,
            endTime: new Date(),
            comment
        });
    }

    pushExecutionActivity(
        durationInSeconds: number,
        processName: string,
        exitCode: number,
        executionTaskType: string,
        isDebug: boolean
    ): void {
        this.executionActivities.push({
            durationInSeconds,
            endTime: new Date(),
            processName,
            exitCode,
            executionTaskType,
            debug: isDebug
        });
    }

    pushEvent(_eventType: string, _message: string): void {
        // No-op for tests
    }

    flush(): void {
        // No-op for tests
    }
} 