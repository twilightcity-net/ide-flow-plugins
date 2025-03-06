import * as vscode from 'vscode';
import { Action, ActionType } from './ActionType';
import { FlowInsightActionContext } from '../data/FlowInsightActionContext';
import { Logger } from '../../Logger';

export class RunAction {
    constructor(private logger: Logger) {}

    async execute(context: FlowInsightActionContext): Promise<void> {
        try {
            await vscode.commands.executeCommand(context.actionId, context.parameters);
        } catch (error) {
            this.logger.error(`Failed to execute run action: ${error}`, error as Error);
        }
    }
} 