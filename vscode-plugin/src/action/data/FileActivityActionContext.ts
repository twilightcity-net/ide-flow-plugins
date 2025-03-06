export interface FileActivityActionContext {
    filePath: string;
    module?: string;
    lineNumber?: number;
    columnNumber?: number;
}

export function createFileActivityContext(
    filePath: string,
    module?: string,
    lineNumber?: number,
    columnNumber?: number
): FileActivityActionContext {
    return {
        filePath,
        module,
        lineNumber,
        columnNumber
    };
} 