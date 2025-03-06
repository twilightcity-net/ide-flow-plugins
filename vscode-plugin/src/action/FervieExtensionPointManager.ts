import * as vscode from 'vscode';
import { FerviePopupByHotKeyAction } from './api/FerviePopupByHotKeyAction';
import { Logger } from '../Logger';

export class FervieExtensionPointManager {
    private static readonly EXTENSION_POINT = 'flowinsight.ferviePopupAction';
    private registeredActions: Map<string, FerviePopupByHotKeyAction> = new Map();

    constructor(
        private context: vscode.ExtensionContext,
        private logger: Logger
    ) {
        this.registerExtensionPoint();
    }

    private registerExtensionPoint() {
        // Register the extension point
        vscode.commands.registerCommand('flowinsight.registerFervieAction', 
            (action: FerviePopupByHotKeyAction) => {
                this.registerAction(action);
            }
        );
    }

    private registerAction(action: FerviePopupByHotKeyAction) {
        try {
            const actionId = action.getActionId();
            this.logger.info(`Registering Fervie action: ${actionId}`);
            
            // Register the action
            this.registeredActions.set(actionId, action);

            // Create command for this action
            const disposable = vscode.commands.registerCommand(
                `flowinsight.fervie.${actionId}`,
                () => action.onFervieAction()
            );
            this.context.subscriptions.push(disposable);

            // Update Fervie action configuration
            this.updateFervieActionConfig();
        } catch (error) {
            this.logger.error('Failed to register Fervie action', error as Error);
        }
    }

    private updateFervieActionConfig() {
        const actions = Array.from(this.registeredActions.values()).map(action => ({
            actionId: action.getActionId(),
            buttonText: action.getFervieButtonText(),
            buttonTooltip: action.getFervieButtonTooltip()
        }));

        // Update the Fervie action configuration
        vscode.workspace.getConfiguration().update(
            'flowinsight.fervieActions',
            actions,
            vscode.ConfigurationTarget.Global
        );
    }

    public getRegisteredActions(): FerviePopupByHotKeyAction[] {
        return Array.from(this.registeredActions.values());
    }
} 