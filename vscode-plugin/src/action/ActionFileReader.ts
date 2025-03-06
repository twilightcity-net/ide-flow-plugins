import * as fs from 'fs';
import * as readline from 'readline';
import { Action, ActionType } from './type/ActionType';
import { createFileActivityContext } from './data/FileActivityActionContext';
import { createFlowInsightContext } from './data/FlowInsightActionContext';
import { Logger } from '../Logger';

export class ActionFileReader {
    constructor(private logger: Logger) {}

    public async readActions(filePath: string): Promise<Action[]> {
        const actions: Action[] = [];

        try {
            const fileStream = fs.createReadStream(filePath);
            const rl = readline.createInterface({
                input: fileStream,
                crlfDelay: Infinity
            });

            for await (const line of rl) {
                try {
                    const action = this.parseLine(line);
                    if (action) {
                        actions.push(action);
                    }
                } catch (error) {
                    this.logger.warn(`Failed to parse action line: ${line}`);
                }
            }
        } catch (error) {
            this.logger.error(`Failed to read actions file: ${filePath}`, error as Error);
        }

        return actions;
    }

    private parseLine(line: string): Action | null {
        try {
            const [type, ...parts] = line.split('=');
            const data = JSON.parse(parts.join('='));

            switch (type) {
                case 'GOTO':
                    return {
                        type: ActionType.GOTO,
                        data: createFileActivityContext(
                            data.filePath,
                            data.module,
                            data.lineNumber,
                            data.columnNumber
                        )
                    };
                case 'RUN':
                    return {
                        type: ActionType.RUN,
                        data: createFlowInsightContext(
                            data.actionId,
                            data.parameters
                        )
                    };
                default:
                    this.logger.warn(`Unknown action type: ${type}`);
                    return null;
            }
        } catch (error) {
            this.logger.warn(`Invalid action format: ${line}`);
            return null;
        }
    }
} 