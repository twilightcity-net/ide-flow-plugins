import * as vscode from 'vscode';
import { Action, ActionType } from './ActionType';
import { FileActivityActionContext } from '../data/FileActivityActionContext';
import { Logger } from '../../Logger';

export class GotoAction {
    constructor(private logger: Logger) {}

    async execute(context: FileActivityActionContext): Promise<void> {
        try {
            const uri = vscode.Uri.file(context.filePath);
            const document = await vscode.workspace.openTextDocument(uri);
            const editor = await vscode.window.showTextDocument(document);

            if (context.lineNumber !== undefined) {
                const position = new vscode.Position(
                    context.lineNumber,
                    context.columnNumber || 0
                );
                editor.selection = new vscode.Selection(position, position);
                editor.revealRange(
                    new vscode.Range(position, position),
                    vscode.TextEditorRevealType.InCenter
                );
            }
        } catch (error) {
            this.logger.error(`Failed to execute goto action: ${error}`, error as Error);
        }
    }
} 