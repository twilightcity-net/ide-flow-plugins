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

        // Format dates in ISO format
        const processed = JSON.stringify(object, (key, value) => {
            if (value instanceof Date) {
                return format(value, "yyyy-MM-dd'T'HH:mm:ss");
            }
            return value;
        });

        return `${type}=${processed}`;
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