package net.twilightcity.flow.activity;

import net.twilightcity.flow.Logger;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class ModuleManager {

    private final Logger logger;
    private final FlowInsightConfig flowInsightConfig;

    private List<FlowInsightConfig.ModuleConfig> moduleConfigs = new ArrayList<>();

    private final Set<String> enabledModules = new HashSet<>();
    private Set<String> disabledModules = new HashSet<>();

    public ModuleManager(Logger logger, FlowInsightConfig flowInsightConfig) {
        this.logger = logger;
        this.flowInsightConfig = flowInsightConfig;
        initModuleConfigFromFile();
    }

    public boolean isModuleEnabled(String moduleName) {
        return enabledModules.contains(moduleName);
    }

    public boolean isModuleKnown(String moduleName) {
        return enabledModules.contains(moduleName) || disabledModules.contains(moduleName);
    }

    public void enableModule(String moduleName, String rootDir) {
        logger.info("Enabling activity recording for module "+moduleName + " in FlowInsight");
        FlowInsightConfig.ModuleConfig config = new FlowInsightConfig.ModuleConfig(moduleName, rootDir);
        moduleConfigs.add(config);
        enabledModules.add(moduleName);
        flushToJson();
    }

    public void disableModule(String moduleName) {
        logger.info("Disabling activity recording for module "+moduleName + " in FlowInsight");
        disabledModules.add(moduleName);
        flushToJson();
    }


    private void initModuleConfigFromFile() {
        FlowInsightConfig.ModuleConfigSet config = flowInsightConfig.getConfigFromFile();
        initConfig(config);
    }

    private void initConfig(FlowInsightConfig.ModuleConfigSet moduleConfigSet) {
        if (moduleConfigSet != null) {
            this.moduleConfigs = moduleConfigSet.getModules();
            this.disabledModules = new HashSet<>(moduleConfigSet.getDisabled());

            for (FlowInsightConfig.ModuleConfig config : this.moduleConfigs) {
                this.enabledModules.add(config.getModuleName());
            }
        } else {
            logger.warn("Initialized module manager with no configuration");
        }
    }

    private void flushToJson() {
        FlowInsightConfig.ModuleConfigSet config = new FlowInsightConfig.ModuleConfigSet();
        config.setModules(moduleConfigs);
        config.setDisabled(new ArrayList<>(disabledModules));

        flowInsightConfig.saveToJson(config);
    }

}
