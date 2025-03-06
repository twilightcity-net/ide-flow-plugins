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
    editorActivities: EditorActivity[] = [];
    externalActivities: ExternalActivity[] = [];
    executionActivities: ExecutionActivity[] = [];

    pushEditorActivity(
        durationInSeconds: number,
        endTime: Date,
        filePath: string,
        module: string | undefined,
        modified: boolean
    ): void {
        this.editorActivities.push({
            durationInSeconds,
            endTime,
            module,
            filePath,
            modified
        });
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
} 