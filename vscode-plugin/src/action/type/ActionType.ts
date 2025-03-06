export enum ActionType {
    GOTO = 'GOTO',
    RUN = 'RUN'
}

export interface Action {
    type: ActionType;
    data: FileActivityActionContext | FlowInsightActionContext;
} 