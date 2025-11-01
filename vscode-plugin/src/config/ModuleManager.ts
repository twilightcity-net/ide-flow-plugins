import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../Logger';

interface ModuleConfig {
    moduleName: string;
    rootDir: string;
}

interface ModuleConfigSet {
    yesToAllEnabled?: boolean;
    modules?: ModuleConfig[];
    disabled?: string[];
}

export class ModuleManager {
    private enabledModules: Set<string> = new Set();
    private disabledModules: Set<string> = new Set();
    private moduleConfigs: ModuleConfig[] = [];
    private yesToAllEnabled: boolean = false;
    private configFile: string;
    private logger: Logger;

    constructor(baseDir?: string, logger?: Logger) {
        this.logger = logger || console as any;
        const configDir = baseDir || this.getDefaultConfigDir();
        this.configFile = path.join(configDir, 'flowinsight-config.json');
        this.loadConfig();
    }

    public isModuleEnabled(moduleName: string | undefined): boolean {
        if (!moduleName || moduleName === 'default') {
            return true;
        }
        if (this.yesToAllEnabled) {
            return !this.disabledModules.has(moduleName);
        }
        return this.enabledModules.has(moduleName);
    }

    public isModuleKnown(moduleName: string): boolean {
        return this.enabledModules.has(moduleName) || this.disabledModules.has(moduleName);
    }

    public enableModule(moduleName: string, rootDir?: string): void {
        this.logger.info(`Enabling activity recording for module ${moduleName} in FlowInsight`);
        
        if (rootDir) {
            // Update or add module config
            const existingIndex = this.moduleConfigs.findIndex(m => m.moduleName === moduleName);
            if (existingIndex >= 0) {
                this.moduleConfigs[existingIndex].rootDir = rootDir;
            } else {
                this.moduleConfigs.push({ moduleName, rootDir });
            }
        }
        
        this.enabledModules.add(moduleName);
        this.disabledModules.delete(moduleName);
        this.saveConfig();
    }

    public disableModule(moduleName: string): void {
        this.logger.info(`Disabling activity recording for module ${moduleName} in FlowInsight`);
        this.disabledModules.add(moduleName);
        this.enabledModules.delete(moduleName);
        this.saveConfig();
    }

    public enableYesToAll(): void {
        this.yesToAllEnabled = true;
        this.disabledModules.clear();
        this.saveConfig();
    }

    public isYesToAllEnabled(): boolean {
        return this.yesToAllEnabled;
    }

    public getModuleRootDir(moduleName: string): string | undefined {
        const config = this.moduleConfigs.find(m => m.moduleName === moduleName);
        return config?.rootDir;
    }

    private getDefaultConfigDir(): string {
        const homeDir = process.env.HOME || process.env.USERPROFILE || '';
        return path.join(homeDir, '.flow', 'plugins', 'com.microsoft.vscode');
    }

    private loadConfig(): void {
        try {
            if (fs.existsSync(this.configFile)) {
                const content = fs.readFileSync(this.configFile, 'utf8');
                const config = JSON.parse(content) as ModuleConfigSet;
                
                if (config.modules) {
                    this.moduleConfigs = config.modules;
                    this.enabledModules = new Set(config.modules.map(m => m.moduleName));
                }
                
                if (config.disabled) {
                    this.disabledModules = new Set(config.disabled);
                }
                
                if (config.yesToAllEnabled !== undefined) {
                    this.yesToAllEnabled = config.yesToAllEnabled;
                }
            }
        } catch (error) {
            this.logger.error('Failed to load module config', error as Error);
        }
    }

    private saveConfig(): void {
        try {
            const config: ModuleConfigSet = {
                modules: this.moduleConfigs,
                disabled: Array.from(this.disabledModules),
                yesToAllEnabled: this.yesToAllEnabled
            };
            
            fs.mkdirSync(path.dirname(this.configFile), { recursive: true });
            fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2));
        } catch (error) {
            this.logger.error('Failed to save module config', error as Error);
        }
    }
} 