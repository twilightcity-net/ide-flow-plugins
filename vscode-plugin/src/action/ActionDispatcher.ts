import { Action, ActionType } from './type/ActionType';
import { GotoAction } from './type/GotoAction';
import { RunAction } from './type/RunAction';
import { FileActivityActionContext } from './data/FileActivityActionContext';
import { FlowInsightActionContext } from './data/FlowInsightActionContext';
import { Logger } from '../Logger';
import { FervieExtensionPointManager } from './FervieExtensionPointManager';

export class ActionDispatcher {
    private gotoAction: GotoAction;
    private runAction: RunAction;

    constructor(
        private logger: Logger,
        extensionPointManager?: FervieExtensionPointManager
    ) {
        this.gotoAction = new GotoAction(logger);
        this.runAction = new RunAction(logger, extensionPointManager);
    }

    public setExtensionPointManager(extensionPointManager: FervieExtensionPointManager): void {
        this.runAction = new RunAction(this.logger, extensionPointManager);
    }

    async dispatch(action: Action): Promise<void> {
        try {
            switch (action.type) {
                case ActionType.GOTO:
                    await this.gotoAction.execute(action.data as FileActivityActionContext);
                    break;
                case ActionType.RUN:
                    await this.runAction.execute(action.data as FlowInsightActionContext);
                    break;
                default:
                    this.logger.warn(`Unknown action type: ${action.type}`);
            }
        } catch (error) {
            this.logger.error('Failed to dispatch action', error as Error);
        }
    }
} 