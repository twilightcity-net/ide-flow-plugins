import { format } from 'date-fns';

export class JSONConverter {
    private idToClassMap: Map<string, string>;
    private classToIdMap: Map<string, string>;

    constructor() {
        this.idToClassMap = new Map([
            ['EditorActivity', 'NewEditorActivityDto'],
            ['ExecutionActivity', 'NewExecutionActivityDto'],
            ['ExternalActivity', 'NewExternalActivityDto'],
            ['ModificationActivity', 'NewModificationActivityDto'],
            ['Event', 'NewFlowBatchEventDto'],
            ['SnippetEvent', 'NewSnippetEventDto']
        ]);

        this.classToIdMap = new Map(
            Array.from(this.idToClassMap.entries()).map(([k, v]) => [v, k])
        );
    }

    public toJSON(object: any): string {
        const type = this.getTypeForObject(object);
        if (!type) {
            throw new Error(`Unable to find type for object: ${JSON.stringify(object)}`);
        }

        // Format dates in ISO format (local time, no timezone, no milliseconds)
        // This matches Java's LocalDateTime serialization format
        // Note: We need to replace Date objects with strings BEFORE JSON.stringify
        // because Date.prototype.toJSON() is called automatically and returns toISOString()
        const processed = JSON.stringify(this.replaceDates(object));

        return `${type}=${processed}`;
    }

    private replaceDates(obj: any): any {
        if (obj instanceof Date) {
            // Use date-fns format which formats in local timezone (matching Java LocalDateTime)
            // Format: "yyyy-MM-dd'T'HH:mm:ss" (no timezone, no milliseconds)
            return format(obj, "yyyy-MM-dd'T'HH:mm:ss");
        }
        
        if (obj === null || obj === undefined) {
            return obj;
        }
        
        if (Array.isArray(obj)) {
            return obj.map(item => this.replaceDates(item));
        }
        
        if (typeof obj === 'object') {
            const result: any = {};
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    result[key] = this.replaceDates(obj[key]);
                }
            }
            return result;
        }
        
        return obj;
    }

    private getTypeForObject(object: any): string | undefined {
        // Determine type based on object properties
        if ('filePath' in object && 'durationInSeconds' in object) {
            return 'EditorActivity';
        }
        if ('processName' in object && 'executionTaskType' in object) {
            return 'ExecutionActivity';
        }
        if ('modificationCount' in object) {
            return 'ModificationActivity';
        }
        if ('comment' in object && 'durationInSeconds' in object) {
            return 'ExternalActivity';
        }
        if ('type' in object && 'position' in object) {
            return 'Event';
        }
        return undefined;
    }
} 