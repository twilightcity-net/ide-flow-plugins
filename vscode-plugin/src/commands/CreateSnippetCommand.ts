import * as vscode from 'vscode';
import { FlowController } from '../controller/FlowController';
import { Logger } from '../Logger';

enum SnippetSourceType {
    EDITOR = 'EDITOR',
    CONSOLE = 'CONSOLE',
    DEBUGGER = 'DEBUGGER'
}

export class CreateSnippetCommand {
    constructor(
        private controller: FlowController,
        private logger: Logger
    ) {}

    async execute(): Promise<void> {
        if (!this.controller.isActive()) {
            vscode.window.showErrorMessage('FlowInsight is not active. Please initialize it first.');
            return;
        }

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor');
            return;
        }

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);

        if (!selectedText) {
            vscode.window.showWarningMessage('No text selected');
            return;
        }

        try {
            // Determine if this is a console view
            const isConsole = editor.document.uri.scheme === 'output';
            
            if (isConsole) {
                await this.controller.publishSnippet(SnippetSourceType.CONSOLE, selectedText);
            } else {
                const filePath = this.getRelativeFilePath(editor.document.uri);
                const lineNumber = selection.start.line;
                await this.controller.publishSnippet(
                    SnippetSourceType.EDITOR,
                    selectedText,
                    filePath,
                    lineNumber
                );
            }

            vscode.window.showInformationMessage('Snippet sent to FlowInsight');
        } catch (error) {
            this.logger.error('Failed to publish snippet', error as Error);
            vscode.window.showErrorMessage(`Failed to send snippet: ${error}`);
        }
    }

    private getRelativeFilePath(uri: vscode.Uri): string {
        // Try to get workspace-relative path
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        if (workspaceFolder) {
            const relativePath = vscode.workspace.asRelativePath(uri, false);
            return relativePath;
        }
        
        // Fallback to full path
        return uri.fsPath;
    }
}


