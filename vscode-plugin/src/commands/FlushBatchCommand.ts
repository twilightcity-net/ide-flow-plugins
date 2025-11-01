import * as vscode from 'vscode';
import { FlowController } from '../controller/FlowController';
import { Logger } from '../Logger';

export class FlushBatchCommand {
    constructor(
        private controller: FlowController,
        private logger: Logger
    ) {}

    async execute(): Promise<void> {
        try {
            await this.controller.flushBatch();
            vscode.window.showInformationMessage('Flow activity uploaded to FlowInsight');
        } catch (error) {
            this.logger.error('Failed to flush batch', error as Error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to upload flow: ${errorMessage}`);
        }
    }
}


