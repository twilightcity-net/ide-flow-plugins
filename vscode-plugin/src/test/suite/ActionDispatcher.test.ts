import * as assert from 'assert';
import * as vscode from 'vscode';
import { ActionDispatcher } from '../../action/ActionDispatcher';
import { Action, ActionType } from '../../action/type/ActionType';
import { createFileActivityContext } from '../../action/data/FileActivityActionContext';
import { createFlowInsightContext } from '../../action/data/FlowInsightActionContext';
import { Logger } from '../../Logger';

suite('ActionDispatcher Tests', () => {
    let dispatcher: ActionDispatcher;
    let logger: Logger;

    setup(() => {
        logger = new Logger();
        dispatcher = new ActionDispatcher(logger);
    });

    test('should dispatch GOTO action', async () => {
        // Arrange
        const action: Action = {
            type: ActionType.GOTO,
            data: createFileActivityContext(
                '/test/file.ts',
                'testModule',
                10,
                5
            )
        };

        // Act & Assert
        await assert.doesNotThrow(async () => {
            await dispatcher.dispatch(action);
        });
    });

    test('should dispatch RUN action', async () => {
        // Arrange
        const action: Action = {
            type: ActionType.RUN,
            data: createFlowInsightContext(
                'test.command',
                { param: 'value' }
            )
        };

        // Act & Assert
        await assert.doesNotThrow(async () => {
            await dispatcher.dispatch(action);
        });
    });

    test('should handle unknown action type', async () => {
        // Arrange
        const action = {
            type: 'UNKNOWN' as ActionType,
            data: {} as any
        };

        // Act & Assert
        await assert.doesNotThrow(async () => {
            await dispatcher.dispatch(action as Action);
        });
    });
}); 