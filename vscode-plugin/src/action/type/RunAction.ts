import * as vscode from 'vscode';
import { Action, ActionType } from './ActionType';
import { FlowInsightActionContext } from '../data/FlowInsightActionContext';
import { Logger } from '../../Logger';
import { FervieExtensionPointManager } from '../FervieExtensionPointManager';
import { FlowStateContext } from '../api/FerviePopupByHotKeyAction';

export class RunAction {
    constructor(
        private logger: Logger,
        private extensionPointManager?: FervieExtensionPointManager
    ) {}

    async execute(context: FlowInsightActionContext): Promise<void> {
        try {
            if (this.extensionPointManager) {
                // Fire action through extension point manager (similar to IntelliJ's FervieActionDispatcher)
                const registeredActions = this.extensionPointManager.getRegisteredActions();
                const action = registeredActions.find(a => a.getActionId() === context.actionId);
                
                if (action) {
                    // Create FlowStateContext for the action
                    const flowStateContext = this.createFlowStateContext(context);
                    action.onFervieAction(flowStateContext);
                } else {
                    // Fallback to command execution
                    await vscode.commands.executeCommand(context.actionId, context.parameters);
                }
            } else {
                // Fallback to command execution
                await vscode.commands.executeCommand(context.actionId, context.parameters);
            }
        } catch (error) {
            this.logger.error(`Failed to execute run action: ${error}`, error as Error);
        }
    }

    private createFlowStateContext(_context: FlowInsightActionContext): FlowStateContext {
        // TODO: Create proper FlowStateContext with current flow state, momentum, and file activity
        // For now, return a basic implementation
        return {
            getCurrentFlowState: () => 'FLOW',
            getCurrentMomentum: () => null,
            getMostRecentFileActivity: () => []
        };
    }
} 