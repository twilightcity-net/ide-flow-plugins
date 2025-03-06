import * as assert from 'assert';
import * as vscode from 'vscode';
import { TestExecutionTracker } from '../../debug/TestExecutionTracker';
import { ActivityHandler } from '../../activity/ActivityHandler';
import { MockMessageQueue } from '../mocks/MockMessageQueue';
import { TimeService } from '../../time/TimeService';

suite('TestExecutionTracker Tests', () => {
    let messageQueue: MockMessageQueue;
    let activityHandler: ActivityHandler;
    let tracker: TestExecutionTracker;

    setup(() => {
        messageQueue = new MockMessageQueue();
        activityHandler = new ActivityHandler(messageQueue, new TimeService());
        tracker = new TestExecutionTracker(activityHandler);
    });

    test('should track test execution start and end', () => {
        // Arrange
        const debugSession = {
            id: 'test-session',
            type: 'java',
            name: 'Test',
            configuration: {
                type: 'java',
                request: 'test'
            }
        } as vscode.DebugSession;

        // Act - Simulate debug session start
        const startEvent = new vscode.EventEmitter<vscode.DebugSession>();
        startEvent.fire(debugSession);

        // Simulate test start event
        const customEvent = new vscode.EventEmitter<vscode.DebugSessionCustomEvent>();
        customEvent.fire({
            session: debugSession,
            event: 'test-run',
            body: {
                type: 'test-start',
                testId: 1,
                testName: 'testMethod'
            }
        });

        // Simulate test end event
        customEvent.fire({
            session: debugSession,
            event: 'test-run',
            body: {
                type: 'test-end',
                testId: 1,
                testName: 'testMethod',
                passed: true
            }
        });

        // Simulate debug session end
        const endEvent = new vscode.EventEmitter<vscode.DebugSession>();
        endEvent.fire(debugSession);

        // Assert
        assert.strictEqual(messageQueue.executionActivities.length, 1);
        const activity = messageQueue.executionActivities[0];
        assert.strictEqual(activity.processName, 'testMethod');
        assert.strictEqual(activity.exitCode, 0);
        assert.strictEqual(activity.executionTaskType, 'JUnit');
    });

    test('should handle malformed test events gracefully', () => {
        // Arrange
        const debugSession = {
            id: 'test-session',
            type: 'java',
            name: 'Test',
            configuration: {
                type: 'java',
                request: 'test'
            }
        } as vscode.DebugSession;

        // Act & Assert
        const customEvent = new vscode.EventEmitter<vscode.DebugSessionCustomEvent>();
        assert.doesNotThrow(() => {
            customEvent.fire({
                session: debugSession,
                event: 'test-run',
                body: {
                    type: 'test-start',
                    // Missing required fields
                }
            });
        });
    });

    test('should handle test end without corresponding start', () => {
        // Arrange
        const debugSession = {
            id: 'test-session',
            type: 'java',
            name: 'Test',
            configuration: {
                type: 'java',
                request: 'test'
            }
        } as vscode.DebugSession;

        // Act
        const customEvent = new vscode.EventEmitter<vscode.DebugSessionCustomEvent>();
        customEvent.fire({
            session: debugSession,
            event: 'test-run',
            body: {
                type: 'test-end',
                testId: 1,
                testName: 'testMethod',
                passed: true
            }
        });

        // Assert
        assert.strictEqual(messageQueue.executionActivities.length, 0);
    });
}); 