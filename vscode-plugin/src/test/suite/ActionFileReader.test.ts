import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { ActionFileReader } from '../../action/ActionFileReader';
import { ActionType } from '../../action/type/ActionType';
import { Logger } from '../../Logger';
import { FileActivityActionContext } from '../../action/data/FileActivityActionContext';
import { FlowInsightActionContext } from '../../action/data/FlowInsightActionContext';

suite('ActionFileReader Tests', () => {
    let reader: ActionFileReader;
    let testFilePath: string;
    let logger: Logger;

    setup(() => {
        logger = new Logger();
        reader = new ActionFileReader(logger);
        testFilePath = path.join(__dirname, 'test-actions.txt');
    });

    teardown(() => {
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
        }
    });

    test('should read GOTO action', async () => {
        // Arrange
        const actionData = 'GOTO={"filePath":"/test/file.ts","module":"testModule","lineNumber":10}\n';
        fs.writeFileSync(testFilePath, actionData);

        // Act
        const actions = await reader.readActions(testFilePath);

        // Assert
        assert.strictEqual(actions.length, 1);
        assert.strictEqual(actions[0].type, ActionType.GOTO);
        const fileContext = actions[0].data as FileActivityActionContext;
        assert.strictEqual(fileContext.filePath, '/test/file.ts');
    });

    test('should read RUN action', async () => {
        // Arrange
        const actionData = 'RUN={"actionId":"test.command","parameters":{"param":"value"}}\n';
        fs.writeFileSync(testFilePath, actionData);

        // Act
        const actions = await reader.readActions(testFilePath);

        // Assert
        assert.strictEqual(actions.length, 1);
        assert.strictEqual(actions[0].type, ActionType.RUN);
        const flowContext = actions[0].data as FlowInsightActionContext;
        assert.strictEqual(flowContext.actionId, 'test.command');
    });

    test('should handle invalid action format', async () => {
        // Arrange
        const actionData = 'INVALID={"bad":"json"\n';
        fs.writeFileSync(testFilePath, actionData);

        // Act
        const actions = await reader.readActions(testFilePath);

        // Assert
        assert.strictEqual(actions.length, 0);
    });
}); 