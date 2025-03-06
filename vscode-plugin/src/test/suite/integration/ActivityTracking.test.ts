import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ActivityHandler } from '../../../activity/ActivityHandler';
import { MessageQueue } from '../../../activity/MessageQueue';
import { TimeService } from '../../../time/TimeService';
import { ModuleManager } from '../../../config/ModuleManager';

suite('Activity Tracking Integration Tests', () => {
    let tempDir: string;
    let activityHandler: ActivityHandler;
    let messageQueue: MessageQueue;

    setup(async () => {
        tempDir = fs.mkdtempSync(path.join(__dirname, 'flow-test-'));
        const timeService = new TimeService();
        const moduleManager = new ModuleManager(tempDir);
        const activeFlowFile = path.join(tempDir, 'active.flow');
        
        messageQueue = new MessageQueue(timeService, moduleManager, activeFlowFile);
        activityHandler = new ActivityHandler(messageQueue, timeService);
    });

    teardown(() => {
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    test('should track file activity in VSCode', async () => {
        // Create a test file
        const testFile = path.join(tempDir, 'test.ts');
        fs.writeFileSync(testFile, 'console.log("test");');

        // Open the file in VSCode
        const document = await vscode.workspace.openTextDocument(testFile);
        await vscode.window.showTextDocument(document);

        // Make some edits
        const edit = new vscode.WorkspaceEdit();
        edit.insert(document.uri, new vscode.Position(0, 0), '// Test comment\n');
        await vscode.workspace.applyEdit(edit);

        // Wait for activity to be recorded
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Verify activity was recorded
        const flowContent = fs.readFileSync(path.join(tempDir, 'active.flow'), 'utf8');
        const lines = flowContent.split('\n').filter(line => line.trim());
        
        assert.ok(lines.some(line => line.startsWith('EditorActivity=')));
        assert.ok(lines.some(line => line.startsWith('ModificationActivity=')));
    });
}); 