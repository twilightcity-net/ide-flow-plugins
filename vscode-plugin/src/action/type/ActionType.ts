import { FileActivityActionContext } from '../data/FileActivityActionContext';
import { FlowInsightActionContext } from '../data/FlowInsightActionContext';

export enum ActionType {
    GOTO = 'GOTO',
    RUN = 'RUN'
}

export interface Action {
    type: ActionType;
    data: FileActivityActionContext | FlowInsightActionContext;
} 