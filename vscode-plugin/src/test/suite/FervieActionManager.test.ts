import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as vscode from 'vscode';
import { FervieActionManager } from '../../action/FervieActionManager';
import { Logger } from '../../Logger';

suite('FervieActionManager Tests', () => {
    let tempDir: string;
    let configFile: string;
    let manager: FervieActionManager;
    let logger: Logger;

    setup(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fervie-test-'));
        configFile = path.join(tempDir, 'fervie-actions.json');
        logger = new Logger();
        manager = new FervieActionManager(logger, tempDir);
    });

    teardown(() => {
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    test('should add new Fervie action', () => {
        // Act
        manager.addFervieAction(
            'test.extension',
            'testAction',
            'Test Button',
            'Test Tooltip'
        );
        manager.flushToJson();

        // Assert
        const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
        assert.strictEqual(config.fervieActions.length, 1);
        assert.deepStrictEqual(config.fervieActions[0], {
            extensionName: 'test.extension',
            actionId: 'testAction',
            fervieButtonText: 'Test Button',
            fervieButtonTip: 'Test Tooltip'
        });
    });

    test('should load existing actions from config', () => {
        // Arrange
        const initialConfig = {
            fervieActions: [{
                extensionName: 'test.extension',
                actionId: 'existingAction',
                fervieButtonText: 'Existing Button',
                fervieButtonTip: 'Existing Tooltip'
            }]
        };
        fs.mkdirSync(path.dirname(configFile), { recursive: true });
        fs.writeFileSync(configFile, JSON.stringify(initialConfig));

        // Act
        const newManager = new FervieActionManager(logger, tempDir);

        // Assert
        newManager.flushToJson();
        const loadedConfig = JSON.parse(fs.readFileSync(configFile, 'utf8'));
        assert.deepStrictEqual(loadedConfig, initialConfig);
    });

    test('should register commands for actions', async () => {
        // Arrange
        const context = {
            subscriptions: [] as { dispose(): any }[]
        };
        manager.addFervieAction(
            'test.extension',
            'testAction',
            'Test Button',
            'Test Tooltip'
        );

        // Act
        manager.registerCommands(context as vscode.ExtensionContext);

        // Assert
        assert.strictEqual(context.subscriptions.length, 1);
        const command = await vscode.commands.getCommands(true);
        assert.ok(command.includes('flowinsight.fervie.testAction'));
    });

    test('should handle invalid config file gracefully', () => {
        // Arrange
        fs.mkdirSync(path.dirname(configFile), { recursive: true });
        fs.writeFileSync(configFile, 'invalid json content');

        // Act
        const newManager = new FervieActionManager(logger, tempDir);

        // Assert
        newManager.flushToJson();
        const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
        assert.deepStrictEqual(config, { fervieActions: [] });
    });

    test('should handle file system errors when saving', () => {
        // Arrange
        fs.chmodSync(tempDir, 0o444); // Make directory read-only

        // Act & Assert
        manager.addFervieAction('test.extension', 'testAction', 'Test', 'Tip');
        assert.doesNotThrow(() => {
            manager.flushToJson();
        });
    });
}); 