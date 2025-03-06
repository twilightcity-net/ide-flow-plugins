import * as vscode from 'vscode';
import { ActivityHandler } from '../activity/ActivityHandler';

export class TestExecutionTracker {
    private debugSessions = new Map<string, TestDebugSession>();

    constructor(private activityHandler: ActivityHandler) {
        // Register debug session tracking
        vscode.debug.onDidStartDebugSession(this.handleDebugSessionStart.bind(this));
        vscode.debug.onDidTerminateDebugSession(this.handleDebugSessionEnd.bind(this));
        
        // Track test runs
        vscode.debug.onDidReceiveDebugSessionCustomEvent(this.handleDebugEvent.bind(this));
    }

    private handleDebugSessionStart(session: vscode.DebugSession): void {
        if (this.isTestSession(session)) {
            const testSession = new TestDebugSession(session);
            this.debugSessions.set(session.id, testSession);
        }
    }

    private handleDebugSessionEnd(session: vscode.DebugSession): void {
        const testSession = this.debugSessions.get(session.id);
        if (testSession) {
            this.debugSessions.delete(session.id);
            
            // Report test execution activity
            for (const test of testSession.getCompletedTests()) {
                this.activityHandler.markProcessEnding(
                    test.id,
                    test.passed ? 0 : 1
                );
            }
        }
    }

    private handleDebugEvent(event: vscode.DebugSessionCustomEvent): void {
        const testSession = this.debugSessions.get(event.session.id);
        if (!testSession) {
            return;
        }

        // Handle test start/end events
        if (event.event === 'test-run') {
            const testEvent = event.body as TestEvent;
            
            if (testEvent.type === 'test-start') {
                this.activityHandler.markProcessStarting(
                    testEvent.testId,
                    testEvent.testName,
                    'JUnit', // We'll need to determine the actual test framework
                    event.session.type === 'debug'
                );
                testSession.trackTest(testEvent);
            } 
            else if (testEvent.type === 'test-end') {
                testSession.completeTest(testEvent);
            }
        }
    }

    private isTestSession(session: vscode.DebugSession): boolean {
        // Identify test sessions based on debug configuration
        return session.configuration.type === 'java' && 
               session.configuration.request === 'test';
    }
}

class TestDebugSession {
    private activeTests = new Map<number, TestRun>();
    private completedTests = new Map<number, TestRun>();

    constructor(private session: vscode.DebugSession) {}

    trackTest(event: TestEvent): void {
        this.activeTests.set(event.testId, {
            id: event.testId,
            name: event.testName,
            startTime: new Date(),
            passed: false
        });
    }

    completeTest(event: TestEvent): void {
        const test = this.activeTests.get(event.testId);
        if (test) {
            test.passed = event.passed || false;
            this.completedTests.set(test.id, test);
            this.activeTests.delete(event.testId);
        }
    }

    getCompletedTests(): TestRun[] {
        return Array.from(this.completedTests.values());
    }
}

interface TestRun {
    id: number;
    name: string;
    startTime: Date;
    passed: boolean;
}

interface TestEvent {
    type: 'test-start' | 'test-end';
    testId: number;
    testName: string;
    passed?: boolean;
} 