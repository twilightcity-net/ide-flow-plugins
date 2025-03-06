import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../Logger';

export class ModuleManager {
    private enabledModules: Set<string> = new Set();
    private configFile: string;

    constructor(baseDir?: string) {
        this.configFile = path.join(baseDir || this.getDefaultConfigDir(), 'modules.json');
        this.loadConfig();
    }

    public isModuleEnabled(moduleName: string | undefined): boolean {
        if (!moduleName) {
            return true;
        }
        return this.enabledModules.has(moduleName);
    }

    public enableModule(moduleName: string): void {
        this.enabledModules.add(moduleName);
        this.saveConfig();
    }

    public disableModule(moduleName: string): void {
        this.enabledModules.delete(moduleName);
        this.saveConfig();
    }

    private getDefaultConfigDir(): string {
        const homeDir = process.env.HOME || process.env.USERPROFILE || '';
        return path.join(homeDir, '.flow');
    }

    private loadConfig(): void {
        try {
            if (fs.existsSync(this.configFile)) {
                const config = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
                this.enabledModules = new Set(config.enabledModules || []);
            }
        } catch (error) {
            console.error('Failed to load module config:', error);
        }
    }

    private saveConfig(): void {
        try {
            const config = {
                enabledModules: Array.from(this.enabledModules)
            };
            fs.mkdirSync(path.dirname(this.configFile), { recursive: true });
            fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2));
        } catch (error) {
            console.error('Failed to save module config:', error);
        }
    }
} 