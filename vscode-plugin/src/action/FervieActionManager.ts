import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../Logger';

interface FervieAction {
    extensionName: string;
    actionId: string;
    fervieButtonText: string;
    fervieButtonTip: string;
}

interface FervieActionSet {
    fervieActions: FervieAction[];
}

export class FervieActionManager {
    private actions: FervieAction[] = [];
    private configFile: string;

    constructor(
        private logger: Logger,
        configDir: string
    ) {
        this.configFile = path.join(configDir, 'fervie-actions.json');
        this.loadConfig();
    }

    public addFervieAction(
        extensionName: string,
        actionId: string,
        buttonText: string,
        buttonTip: string
    ): void {
        this.logger.info(`Adding Fervie action ${actionId} from extension ${extensionName}`);
        
        this.actions.push({
            extensionName,
            actionId,
            fervieButtonText: buttonText,
            fervieButtonTip: buttonTip
        });
    }

    public flushToJson(): void {
        const config: FervieActionSet = {
            fervieActions: this.actions
        };

        try {
            fs.mkdirSync(path.dirname(this.configFile), { recursive: true });
            fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2));
        } catch (error) {
            this.logger.error('Failed to save Fervie action config', error as Error);
        }
    }

    private loadConfig(): void {
        try {
            if (fs.existsSync(this.configFile)) {
                const content = fs.readFileSync(this.configFile, 'utf8');
                const config = JSON.parse(content) as FervieActionSet;
                this.actions = config.fervieActions;
            }
        } catch (error) {
            this.logger.error('Failed to load Fervie action config', error as Error);
        }
    }

    public registerCommands(context: vscode.ExtensionContext): void {
        for (const action of this.actions) {
            const command = `flowinsight.fervie.${action.actionId}`;
            const disposable = vscode.commands.registerCommand(command, () => {
                this.executeAction(action);
            });
            context.subscriptions.push(disposable);
        }
    }

    private async executeAction(action: FervieAction): Promise<void> {
        // TODO: Implement action execution logic
        this.logger.info(`Executing Fervie action: ${action.actionId}`);
    }
} 