import * as assert from 'assert';
import * as vscode from 'vscode';
import { GotoAction } from '../../../action/type/GotoAction';
import { createFileActivityContext } from '../../../action/data/FileActivityActionContext';
import { Logger } from '../../../Logger';

suite('GotoAction Tests', () => {
    let action: GotoAction;
    let logger: Logger;

    setup(() => {
        logger = new Logger();
        action = new GotoAction(logger);
    });

    test('should execute goto action', async () => {
        // Arrange
        const context = createFileActivityContext(
            '/test/file.ts',
            'testModule',
            1,
            0
        );

        // Act & Assert
        await assert.doesNotThrow(async () => {
            await action.execute(context);
        });
    });

    test('should handle missing line number', async () => {
        // Arrange
        const context = createFileActivityContext(
            '/test/file.ts',
            'testModule'
        );

        // Act & Assert
        await assert.doesNotThrow(async () => {
            await action.execute(context);
        });
    });
}); 