export interface FerviePopupByHotKeyAction {
    /**
     * Get the unique identifier for this action
     */
    getActionId(): string;

    /**
     * Get the text to display on the Fervie button
     */
    getFervieButtonText(): string;

    /**
     * Get the tooltip text for the Fervie button
     */
    getFervieButtonTooltip(): string;

    /**
     * Called when the Fervie action is triggered
     */
    onFervieAction(): void;
} 