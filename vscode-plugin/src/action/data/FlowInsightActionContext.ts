export interface FlowInsightActionContext {
    actionId: string;
    parameters: { [key: string]: string };
}

export function createFlowInsightContext(
    actionId: string,
    parameters: { [key: string]: string } = {}
): FlowInsightActionContext {
    return {
        actionId,
        parameters
    };
} 