import * as assert from 'assert';
import * as vscode from 'vscode';
import { FervieExtensionPointManager } from '../../action/FervieExtensionPointManager';
import { FerviePopupByHotKeyAction } from '../../action/api/FerviePopupByHotKeyAction';
import { Logger } from '../../Logger';

suite('FervieExtensionPointManager Tests', () => {
    let manager: FervieExtensionPointManager;
    let logger: Logger;
    let context: vscode.ExtensionContext;
    let testAction: FerviePopupByHotKeyAction;

    setup(() => {
        logger = new Logger();
        context = {
            subscriptions: [],
            workspaceState: {} as any,
            globalState: {} as any,
            secrets: {} as any,
            extensionUri: {} as any,
            extensionPath: '',
            globalStorageUri: {} as any,
            workspaceStorageUri: {} as any,
            storageUri: {} as any,
            extensionMode: {} as any,
            environmentVariableCollection: {} as any,
            asAbsolutePath: () => '',
            extension: {} as any,
            logPath: '',
            logUri: {} as any,
            outputChannel: {} as any,
            languageModelAccessInformation: {} as any,
            storagePath: '',
            globalStoragePath: ''
        } as unknown as vscode.ExtensionContext;

        testAction = {
            getActionId: () => 'test.action',
            getFervieButtonText: () => 'Test Action',
            getFervieButtonTooltip: () => 'Test Tooltip',
            onFervieAction: () => {}
        };

        manager = new FervieExtensionPointManager(context, logger);
    });

    test('should register Fervie action', async () => {
        // Act
        await vscode.commands.executeCommand('flowinsight.registerFervieAction', testAction);

        // Assert
        const actions = manager.getRegisteredActions();
        assert.strictEqual(actions.length, 1);
        assert.strictEqual(actions[0].getActionId(), 'test.action');
    });

    test('should create command for registered action', async () => {
        // Act
        await vscode.commands.executeCommand('flowinsight.registerFervieAction', testAction);

        // Assert
        const commands = await vscode.commands.getCommands();
        assert.ok(commands.includes('flowinsight.fervie.test.action'));
    });

    test('should update configuration when action is registered', async () => {
        // Act
        await vscode.commands.executeCommand('flowinsight.registerFervieAction', testAction);

        // Assert
        const config = vscode.workspace.getConfiguration('flowinsight');
        const actions = config.get('fervieActions') as any[];
        assert.strictEqual(actions.length, 1);
        assert.deepStrictEqual(actions[0], {
            actionId: 'test.action',
            buttonText: 'Test Action',
            buttonTooltip: 'Test Tooltip'
        });
    });

    test('should handle registration errors gracefully', async () => {
        // Arrange
        const invalidAction = {} as FerviePopupByHotKeyAction;

        // Act & Assert
        await assert.doesNotThrow(async () => {
            await vscode.commands.executeCommand('flowinsight.registerFervieAction', invalidAction);
        });
    });
}); 