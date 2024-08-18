package net.twilightcity.flow.config;

import net.twilightcity.flow.Logger;

import java.util.ArrayList;
import java.util.List;

public class FervieActionConfigManager {

    private final Logger logger;
    private final FervieActionConfig fervieActionConfig;

    private List<FervieActionConfig.FervieAction> fervieActions = new ArrayList<>();

    public FervieActionConfigManager(Logger logger, FervieActionConfig fervieActionConfig) {
        this.logger = logger;
        this.fervieActionConfig = fervieActionConfig;
    }

    public void addFervieAction(String extensionName, String actionId, String fervieButtonText, String fervieButtonTip) {
        logger.info("Adding fervie action extension "+actionId + "to fervie-action-config in FlowInsight");
        FervieActionConfig.FervieAction config = new FervieActionConfig.FervieAction(extensionName, actionId, fervieButtonText, fervieButtonTip);
        fervieActions.add(config);
        //flushToJson();  //don't want to be doing this multiple times in a loop
    }

    public void flushToJson() {
        FervieActionConfig.FervieActionSet config = new FervieActionConfig.FervieActionSet();
        config.setFervieActions(fervieActions);
        fervieActionConfig.saveToJson(config);
    }
}
