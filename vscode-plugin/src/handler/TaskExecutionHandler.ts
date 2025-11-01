import * as vscode from 'vscode';
import { ActivityHandler } from '../activity/ActivityHandler';
import { Logger } from '../Logger';

interface TaskExecution {
    task: vscode.Task;
    processId: number;
    startTime: Date;
    executionTaskType: string;
    isDebug: boolean;
}

export class TaskExecutionHandler {
    private activeTasks = new Map<string, TaskExecution>();
    private processIdCounter = 1;

    constructor(
        private activityHandler: ActivityHandler,
        private logger: Logger
    ) {
        this.registerTaskListeners();
    }

    private registerTaskListeners(): void {
        // Track when tasks start
        vscode.tasks.onDidStartTask((event: vscode.TaskStartEvent) => {
            this.handleTaskStart(event.execution);
        });

        // Track when tasks end
        vscode.tasks.onDidEndTask((event: vscode.TaskEndEvent) => {
            this.handleTaskEnd(event.execution);
        });

        // Track when task processes start (gives us the actual process)
        vscode.tasks.onDidStartTaskProcess((event: vscode.TaskProcessStartEvent) => {
            this.handleTaskProcessStart(event.execution, event.processId);
        });

        // Track when task processes end (gives us exit code)
        vscode.tasks.onDidEndTaskProcess((event: vscode.TaskProcessEndEvent) => {
            this.handleTaskProcessEnd(event.execution, event.exitCode);
        });
    }

    private handleTaskStart(execution: vscode.TaskExecution): void {
        const task = execution.task;
        const taskKey = this.getTaskKey(execution);
        
        const executionTaskType = this.getExecutionTaskType(task);
        const isDebug = this.isDebugTask(task);
        const processId = this.processIdCounter++;

        this.logger.debug(`Task starting: ${task.name} (${executionTaskType})`);

        // Mark process as starting
        this.activityHandler.markProcessStarting(
            processId,
            task.name,
            executionTaskType,
            isDebug
        );

        // Store task execution info
        this.activeTasks.set(taskKey, {
            task,
            processId,
            startTime: new Date(),
            executionTaskType,
            isDebug
        });
    }

    private handleTaskEnd(execution: vscode.TaskExecution): void {
        const taskKey = this.getTaskKey(execution);
        const taskExecution = this.activeTasks.get(taskKey);
        
        if (taskExecution) {
            this.logger.debug(`Task ended: ${taskExecution.task.name}`);
            // Note: Exit code will be handled by onDidEndTaskProcess if available
            // If process never started, we'll clean up here
            // For now, we'll assume exit code 0 if process event doesn't fire
        }
    }

    private handleTaskProcessStart(execution: vscode.TaskExecution, processId: number): void {
        const taskKey = this.getTaskKey(execution);
        const taskExecution = this.activeTasks.get(taskKey);
        
        if (taskExecution) {
            // Update with actual process ID if different
            taskExecution.processId = processId;
            this.logger.debug(`Task process started: ${taskExecution.task.name} (PID: ${processId})`);
        }
    }

    private handleTaskProcessEnd(execution: vscode.TaskExecution, exitCode: number | undefined): void {
        const taskKey = this.getTaskKey(execution);
        const taskExecution = this.activeTasks.get(taskKey);
        
        if (taskExecution) {
            const finalExitCode = exitCode ?? 0;
            
            this.logger.debug(`Task process ended: ${taskExecution.task.name} (exit code: ${finalExitCode})`);
            
            // Mark process as ending
            this.activityHandler.markProcessEnding(
                taskExecution.processId,
                finalExitCode
            );

            // Clean up
            this.activeTasks.delete(taskKey);
        }
    }

    private getTaskKey(execution: vscode.TaskExecution): string {
        // Create a unique key for the task execution
        // Use task source, definition type, and name to create unique identifier
        const task = execution.task;
        return `${task.source}_${task.definition.type}_${task.name}_${execution.task?.scope}`;
    }

    private getExecutionTaskType(task: vscode.Task): string {
        // Determine task type based on task definition
        // Similar to IntelliJ's ConfigurationType.getDisplayName()
        
        if (task.definition.type) {
            // Map common task types to display names
            const typeMap: { [key: string]: string } = {
                'npm': 'npm',
                'shell': 'Shell Script',
                'process': 'Process',
                'msbuild': 'MSBuild',
                'gulp': 'Gulp',
                'grunt': 'Grunt',
                'maven': 'Maven',
                'gradle': 'Gradle',
                'dotnet': '.NET',
                'python': 'Python',
                'java': 'Java'
            };

            return typeMap[task.definition.type] || task.definition.type;
        }

        // Fallback to task source or name
        return task.source || 'Unknown';
    }

    private isDebugTask(task: vscode.Task): boolean {
        // Check if this is a debug task
        // In VSCode, debug tasks might have specific markers
        return task.group === vscode.TaskGroup.Test || 
               task.name.toLowerCase().includes('debug') ||
               task.definition.type === 'debug';
    }
}


