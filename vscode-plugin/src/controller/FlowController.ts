import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Logger } from '../Logger';
import { FlowPublisher } from '../activity/FlowPublisher';
import { ActivityHandler } from '../activity/ActivityHandler';
import { MessageQueue } from '../activity/MessageQueue';
import { ModuleManager } from '../config/ModuleManager';
import { TimeService } from '../time/TimeService';
import { LastLocationTracker } from '../action/LastLocationTracker';
import { ActionDispatcher } from '../action/ActionDispatcher';
import { ActionFileReader } from '../action/ActionFileReader';
import { Action } from '../action/type/ActionType';

interface ApiSettings {
    apiKey: string;
    apiUrl: string;
}

export class FlowController {
    private active: boolean = false;
    private flowClient?: FlowClient;
    private actionWatcher?: ActionFileWatcher;
    private pushModificationInterval?: NodeJS.Timeout;

    constructor(
        private logger: Logger,
        private flowPublisher: FlowPublisher,
        private activityHandler: ActivityHandler,
        private messageQueue: MessageQueue,
        private moduleManager: ModuleManager,
        private timeService: TimeService,
        private actionDispatcher: ActionDispatcher,
        private actionFileReader: ActionFileReader,
        private pluginDir: string
    ) {}

    public isActive(): boolean {
        return this.active;
    }

    public isInactive(): boolean {
        return !this.active;
    }

    public async start(): Promise<void> {
        if (!this.active) {
            try {
                this.flowClient = await this.createFlowClient();
                // Set FlowClient in FlowPublisher so it can publish batches
                this.flowPublisher.setFlowClient(this.flowClient);
                this.startPushModificationTimer();
                this.startActionWatcher();
                this.flowPublisher.start();
                this.active = true;
                this.logger.info('FlowController started successfully');
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                if (errorMessage.includes('Failed to resolve api settings')) {
                    this.logger.warn(`FlowController not started: API settings not configured. Create ~/.flow/settings.json with apiKey and apiUrl to enable publishing.`);
                    // Start modification timer even without API settings so we can still track modifications
                    this.startPushModificationTimer();
                    // Don't throw - allow extension to activate in degraded mode (tracking only)
                    return;
                }
                this.logger.error('Failed to start FlowController', error as Error);
                throw error;
            }
        }
    }

    public async flushBatch(): Promise<void> {
        if (this.isInactive()) {
            try {
                await this.start();
            } catch (error) {
                this.logger.error('Failed to initialize Flow component', error as Error);
                throw error;
            }
        }

        if (!this.isActive() || !this.flowClient) {
            const settingsFile = path.join(os.homedir(), '.flow', 'settings.json');
            throw new Error(`Cannot flush batch: API settings not configured. Please create ${settingsFile} with your apiKey and apiUrl.`);
        }

        try {
            // Check authentication first (similar to IntelliJ implementation)
            try {
                await this.flowClient.authPing();
            } catch (error) {
                // If auth fails, recreate the client and try again
                if (error instanceof Error && error.name === 'ForbiddenError') {
                    this.flowClient = await this.createFlowClient();
                    await this.flowClient.authPing();
                } else {
                    throw error;
                }
            }
            
            // Trigger immediate publishing (which commits active.flow file)
            await this.flowPublisher.flush();
            this.logger.info('Flow batch flushed successfully');
        } catch (error) {
            this.logger.error('Failed to flush Flow events', error as Error);
            throw error;
        }
    }

    public async publishSnippet(source: string, snippet: string, filePath?: string, lineNumber?: number): Promise<void> {
        if (!this.isActive()) {
            await this.start();
        }

        if (!this.isActive() || !this.flowClient) {
            const settingsFile = path.join(os.homedir(), '.flow', 'settings.json');
            throw new Error(`Cannot publish snippet: API settings not configured. Please create ${settingsFile} with your apiKey and apiUrl.`);
        }

        try {
            await this.flowClient.publishSnippet({
                source,
                snippet,
                filePath,
                lineNumber,
                position: this.timeService.now()
            });
        } catch (error) {
            this.logger.error('Failed to publish snippet', error as Error);
            throw error;
        }
    }

    public shutdown(): void {
        if (this.active) {
            this.active = false;
            
            if (this.pushModificationInterval) {
                clearInterval(this.pushModificationInterval);
                this.pushModificationInterval = undefined;
            }

            if (this.actionWatcher) {
                this.actionWatcher.stop();
                this.actionWatcher = undefined;
            }

            this.flowPublisher.close();
            this.messageQueue.pushEvent('DEACTIVATE', 'IDE Shutdown');
            this.logger.info('FlowController shut down');
        }
    }

    private async createFlowClient(): Promise<FlowClient> {
        const apiSettings = await this.resolveApiSettings();
        return new FlowClient(apiSettings.apiUrl, apiSettings.apiKey, this.logger);
    }

    private async resolveApiSettings(): Promise<ApiSettings> {
        const flowDir = path.join(os.homedir(), '.flow');
        const apiSettingsFile = path.join(flowDir, 'settings.json');

        if (!fs.existsSync(apiSettingsFile)) {
            throw new Error(`Failed to resolve api settings from file=${apiSettingsFile}. Please create this file with your apiKey and apiUrl. See README.md for details.`);
        }

        try {
            const content = fs.readFileSync(apiSettingsFile, 'utf8');
            const settings = JSON.parse(content) as ApiSettings;
            
            if (!settings.apiKey || !settings.apiUrl) {
                throw new Error(`API settings missing apiKey or apiUrl in ${apiSettingsFile}`);
            }

            return settings;
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error(`Failed to read api settings: ${error}`);
        }
    }

    private startPushModificationTimer(): void {
        if (this.pushModificationInterval) {
            clearInterval(this.pushModificationInterval);
        }

        // Push modification activity every 30 seconds
        this.pushModificationInterval = setInterval(() => {
            this.activityHandler.pushModificationActivity(30);
        }, 30000);
    }

    public startActionWatcher(): void {
        const actionsDir = path.join(this.pluginDir, 'actions');
        const actionFile = path.join(actionsDir, 'fervie.action');
        
        // Ensure actions directory exists
        if (!fs.existsSync(actionsDir)) {
            fs.mkdirSync(actionsDir, { recursive: true });
        }
        
        this.actionWatcher = new ActionFileWatcher(
            actionFile,
            actionsDir,
            this.actionFileReader,
            this.actionDispatcher,
            this.logger
        );
        this.actionWatcher.start();
    }

    public getFlowClient(): FlowClient | undefined {
        return this.flowClient;
    }

    public getActivityHandler(): ActivityHandler {
        return this.activityHandler;
    }

    public getModuleManager(): ModuleManager {
        return this.moduleManager;
    }

    public configureActionDispatcher(actionDispatcher: ActionDispatcher): void {
        this.actionDispatcher = actionDispatcher;
        // If watcher is running, restart it with new dispatcher
        if (this.actionWatcher) {
            this.actionWatcher.stop();
            this.startActionWatcher();
        }
    }
}

class FlowClient {
    private static readonly CONNECT_TIMEOUT_MS = 5000;
    private static readonly READ_TIMEOUT_MS = 30000;

    constructor(
        private apiUrl: string,
        private apiKey: string,
        private logger: Logger
    ) {
        // Ensure API URL doesn't end with slash
        this.apiUrl = apiUrl.replace(/\/+$/, '');
    }

    async publishSnippet(snippet: NewSnippetEventDto): Promise<void> {
        const url = `${this.apiUrl}/api/flow/snippets`;
        
        try {
            const response = await this.makeRequest('POST', url, snippet);
            
            if (!response.ok) {
                if (response.status === 403 || response.status === 401) {
                    throw new Error('Access denied, verify your API key is correct');
                }
                const errorText = await response.text().catch(() => 'Unknown error');
                throw new Error(`Failed to publish snippet: ${response.status} ${errorText}`);
            }
            
            this.logger.debug(`Successfully published snippet: ${snippet.snippet?.substring(0, 50)}...`);
        } catch (error) {
            this.logger.error(`Failed to publish snippet: ${error}`);
            throw error;
        }
    }

    async publishBatch(batch: NewFlowBatchDto): Promise<void> {
        const url = `${this.apiUrl}/api/flow/batches`;
        
        try {
            const response = await this.makeRequest('POST', url, batch);
            
            if (!response.ok) {
                if (response.status === 403 || response.status === 401) {
                    throw new Error('Access denied, verify your API key is correct');
                }
                if (response.status === 404) {
                    // Task not found - this is expected for some batches
                    throw new NotFoundError('Task not found');
                }
                const errorText = await response.text().catch(() => 'Unknown error');
                throw new Error(`Failed to publish batch: ${response.status} ${errorText}`);
            }
            
            this.logger.debug(`Successfully published batch with ${batch.getActivityCount()} activities`);
        } catch (error) {
            this.logger.error(`Failed to publish batch: ${error}`);
            throw error;
        }
    }

    async authPing(): Promise<void> {
        const url = `${this.apiUrl}/api/flow/auth/ping`;
        
        try {
            const response = await this.makeRequest('GET', url);
            
            if (!response.ok) {
                if (response.status === 403 || response.status === 401) {
                    throw new ForbiddenError('Access denied, verify your API key is correct');
                }
                throw new Error(`Auth ping failed: ${response.status}`);
            }
            
            this.logger.debug('Auth ping successful');
        } catch (error) {
            this.logger.error(`Auth ping failed: ${error}`);
            throw error;
        }
    }

    private async makeRequest(method: string, url: string, body?: any): Promise<Response> {
        const headers: { [key: string]: string } = {
            'X-API-KEY': this.apiKey,
            'Content-Type': 'application/json'
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), FlowClient.READ_TIMEOUT_MS);

        try {
            const fetchOptions: RequestInit = {
                method,
                headers,
                signal: controller.signal
            };

            if (body) {
                fetchOptions.body = JSON.stringify(body, (_key, value) => {
                    // Convert Date objects to ISO strings
                    if (value instanceof Date) {
                        return value.toISOString();
                    }
                    return value;
                });
            }

            const response = await fetch(url, fetchOptions);
            return response;
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        } finally {
            clearTimeout(timeoutId);
        }
    }
}

class ForbiddenError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ForbiddenError';
    }
}

class NotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NotFoundError';
    }
}

interface NewSnippetEventDto {
    source: string;
    snippet: string;
    filePath?: string;
    lineNumber?: number;
    position: Date;
}

interface NewFlowBatchDto {
    getActivityCount(): number;
    isEmpty(): boolean;
}

class ActionFileWatcher {
    private isRunning: boolean = false;
    private watchInterval?: NodeJS.Timeout;
    private lastModified: number = 0;
    private actionDispatcher: ActionDispatcher;

    constructor(
        private actionFile: string,
        private actionsDir: string,
        private actionFileReader: ActionFileReader,
        actionDispatcher: ActionDispatcher,
        private logger: Logger
    ) {
        this.actionDispatcher = actionDispatcher;
    }

    start(): void {
        this.isRunning = true;
        this.logger.debug('Starting action file watcher...');
        
        // Watch for file changes every second (similar to Java implementation)
        this.watchInterval = setInterval(() => {
            this.checkForChanges();
        }, 1000);
    }

    stop(): void {
        this.isRunning = false;
        if (this.watchInterval) {
            clearInterval(this.watchInterval);
            this.watchInterval = undefined;
        }
    }

    private async checkForChanges(): Promise<void> {
        if (!fs.existsSync(this.actionFile)) {
            return;
        }

        try {
            const stats = fs.statSync(this.actionFile);
            const modifyTime = stats.mtimeMs;

            if (modifyTime !== this.lastModified) {
                this.lastModified = modifyTime;
                await this.handleFileChange(modifyTime);
            }
        } catch (error) {
            this.logger.error('Error checking action file', error as Error);
        }
    }

    private async handleFileChange(modifyTime: number): Promise<void> {
        try {
            // Create a temporary file name with timestamp
            const tempFileName = `${modifyTime}.action`;
            const tempFile = path.join(this.actionsDir, tempFileName);

            // Rename the action file to temp file
            fs.renameSync(this.actionFile, tempFile);

            // Read and dispatch actions
            const actions = await this.actionFileReader.readActions(tempFile);
            this.logger.debug(`Dispatching ${actions.length} actions`);

            for (const action of actions) {
                await this.actionDispatcher.dispatch(action);
            }

            // Delete the temp file
            fs.unlinkSync(tempFile);
        } catch (error) {
            this.logger.warn(`Unable to process action file: ${error}`);
        }
    }

}

