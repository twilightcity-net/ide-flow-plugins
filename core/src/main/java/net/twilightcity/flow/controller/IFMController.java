package net.twilightcity.flow.controller;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import feign.Request;
import feign.RequestInterceptor;
import feign.RequestTemplate;
import net.twilightcity.flow.Logger;
import net.twilightcity.flow.action.Action;
import net.twilightcity.flow.action.ActionDispatcher;
import net.twilightcity.flow.action.FervieActionProcessor;
import net.twilightcity.flow.activity.ActivityHandler;
import net.twilightcity.flow.activity.LastLocationTracker;
import net.twilightcity.flow.config.FervieActionConfig;
import net.twilightcity.flow.config.FervieActionConfigManager;
import net.twilightcity.flow.config.FlowInsightConfig;
import net.twilightcity.flow.activity.MessageQueue;
import net.twilightcity.flow.config.ModuleManager;
import net.twilightcity.gridtime.api.flow.event.EventType;
import net.twilightcity.gridtime.api.flow.event.NewSnippetEventDto;
import net.twilightcity.gridtime.api.flow.event.SnippetSourceType;
import net.twilightcity.gridtime.client.FlowClient;
import net.twilightcity.time.LocalDateTimeService;
import org.dreamscale.exception.ForbiddenException;
import org.dreamscale.feign.DefaultFeignConfig;
import org.dreamscale.jackson.ObjectMapperBuilder;
import org.dreamscale.logging.RequestResponseLoggerFactory;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.time.LocalDateTime;
import java.util.Timer;
import java.util.TimerTask;
import java.util.concurrent.atomic.AtomicBoolean;

public class IFMController {

    private final AtomicBoolean active = new AtomicBoolean(false);
    private final ActivityHandler activityHandler;
    private final MessageQueue messageQueue;
    private final ModuleManager moduleManager;
    private final LastLocationTracker lastLocationTracker;
    private FlowClient flowClient;
    private final PushModificationActivityTimer pushModificationActivityTimer;

    private final FervieActionConfigManager fervieActionManager;
    private final FervieActionProcessor fervieActionProcessor;

    public IFMController(Logger logger) {
        File ideaFlowDir = createFlowPluginDir();
        LocalDateTimeService timeService = new LocalDateTimeService();
        FlowInsightConfig flowInsightConfig = new FlowInsightConfig(logger, getFlowInsightConfigFile());
        moduleManager = new ModuleManager(logger, flowInsightConfig);
        lastLocationTracker = new LastLocationTracker(logger, getLastLocationFile());
        messageQueue = new MessageQueue(timeService, moduleManager, getActiveFlowFile());
        activityHandler = new ActivityHandler(this, messageQueue, timeService);
        pushModificationActivityTimer = new PushModificationActivityTimer(activityHandler, 30);

        FervieActionConfig fervieActionConfig = new FervieActionConfig(logger, getFervieActionConfigFile());
        fervieActionManager = new FervieActionConfigManager(logger, fervieActionConfig);

        fervieActionProcessor = new FervieActionProcessor(logger, getFervieActionsDirectory(), getFervieActionFile());
    }

    private File getFlowDir() {
        return new File(System.getProperty("user.home"), ".flow");
    }

    private File getPluginsDir() {
        return new File(getFlowDir(), "plugins");
    }

    private File getFlowPluginDir() {
        return new File(getPluginsDir(), "com.jetbrains.intellij");
    }

    private File getFlowInsightConfigFile() {
        return new File(getFlowPluginDir(), "flowinsight-config.json");
    }

    private File getActiveFlowFile() {
        return new File(getFlowPluginDir(), "active.flow");
    }

    private File getLastLocationFile() {
        return new File(getFlowPluginDir(), "last-location.json");
    }

    private File getFervieActionConfigFile() {
        return new File(getFlowPluginDir(), "fervie-action-config.json");
    }

    private File getFervieActionsDirectory() {
        return new File(getFlowPluginDir(), "actions");
    }

    private File getFervieActionFile() {
        return new File(getFervieActionsDirectory(), "fervie.action");
    }

    private File createFlowPluginDir() {
        File flowPluginDir = getFlowPluginDir();
        flowPluginDir.mkdirs();
        return flowPluginDir;
    }

    public ActivityHandler getActivityHandler() {
        return activityHandler;
    }

    public ModuleManager getModuleManager() {
        return moduleManager;
    }

    public FervieActionConfigManager getFervieActionConfigManager() {
        return fervieActionManager;
    }

    public FervieActionProcessor getFervieActionProcessor() {
        return fervieActionProcessor;
    }

    public LastLocationTracker getLastLocationTracker() {
        return lastLocationTracker;
    }

    public void flushBatch() {
        if (isActive()) {
            try {
                flowClient.authPing();
            } catch (ForbiddenException ex) {
                flowClient = createFlowClient();
            }
            try {
                flowClient.authPing();
            } catch (ForbiddenException ex) {
                throw new RuntimeException("Access denied, verify your API key is correct");
            }
            messageQueue.flush();
        }
    }

    public boolean isActive() {
        return active.get();
    }

    public boolean isInactive() {
        return active.get() == false;
    }

    public void start() {
        if (active.get() == false) {
            flowClient = createFlowClient();
            pushModificationActivityTimer.start();
            active.set(true);
        }
    }

    public void shutdown() {
        if (active.compareAndSet(true, false)) {
            pushModificationActivityTimer.cancel();
            messageQueue.pushEvent(EventType.DEACTIVATE, "IDE Shutdown");
        }
    }

    private FlowClient createFlowClient() {
        // TODO: make these configurable
        int connectTimeoutMillis = 5000;
        int readTimeoutMillis = 30000;

        ApiSettings apiSettings = resolveApiSettings();

        return new DefaultFeignConfig()
                .jacksonFeignBuilder()
                .requestResponseLoggerFactory(new RequestResponseLoggerFactory())
                .requestInterceptor(new StaticAuthHeaderRequestInterceptor(apiSettings.getApiKey()))
                .options(new Request.Options(connectTimeoutMillis, readTimeoutMillis))
                .target(FlowClient.class, apiSettings.getApiUrl());
    }

    private ApiSettings resolveApiSettings() {
        File apiSettingsFile = new File(getFlowDir(), "settings.json");
        if (apiSettingsFile.exists() == false) {
            throw new InvalidApiKeyException("Failed to resolve api settings from file=" + apiSettingsFile.getAbsolutePath());
        }

        try {
            String jsonStr = new String(Files.readAllBytes(apiSettingsFile.toPath()));

            ObjectMapper mapper = new ObjectMapperBuilder()
                    .jsr310TimeModule()
                    .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
                    .build();

            return mapper.readValue(jsonStr, ApiSettings.class);
        } catch (IOException ex) {
            throw new InvalidApiKeyException("Failed to read api settings=" + apiSettingsFile.getAbsolutePath(), ex);
        }

    }

    public static String decrypt(String encryptedAPIKey) {
       //todo
        return "";
    }

    public void publishFileSnippet(SnippetSourceType source, String snippet, String filePath, Integer lineNumber) {
        NewSnippetEventDto snippetEvent = NewSnippetEventDto.builder()
                .source(source)
                .snippet(snippet)
                .filePath(filePath)
                .lineNumber(lineNumber)
                .position(LocalDateTime.now())
                .build();
        flowClient.publishSnippet(snippetEvent);
    }

    public void publishSnippet(SnippetSourceType source, String snippet) {
        NewSnippetEventDto snippetEvent = NewSnippetEventDto.builder()
                .source(source)
                .snippet(snippet)
                .position(LocalDateTime.now())
                .build();
        flowClient.publishSnippet(snippetEvent);
    }

    public void configureActionDispatcher(ActionDispatcher actionDispatcher) {
        fervieActionProcessor.configureActionDispatcher(actionDispatcher);
    }

    private static final class InvalidApiKeyException extends RuntimeException {
        InvalidApiKeyException(String message) {
            super(message);
        }

        InvalidApiKeyException(String message, Throwable cause) {
            super(message, cause);
        }
    }

    private static class PushModificationActivityTimer {

        private Timer timer;
        private ActivityHandler activityHandler;
        private long intervalInSeconds;

        public PushModificationActivityTimer(ActivityHandler activityHandler, int intervalInSeconds) {
            this.activityHandler = activityHandler;
            this.intervalInSeconds = intervalInSeconds;
        }

        public void start() {
            if (timer != null) {
                timer.cancel();
            }

            TimerTask timerTask = new TimerTask() {
                @Override
                public void run() {
                    activityHandler.pushModificationActivity(intervalInSeconds);
                }
            };

            long intervalInMillis = intervalInSeconds * 1000;
            timer = new Timer();
            timer.scheduleAtFixedRate(timerTask, intervalInMillis, intervalInMillis);
        }

        public void cancel() {
            timer.cancel();
            timer = null;
        }

    }

    private static class ApiSettings {
        private String apiKey;
        private String apiUrl;

        public String getApiKey() {
            return apiKey;
        }

        public void setApiKey(String apiKey) {
            this.apiKey = apiKey;
        }

        public String getApiUrl() {
            return apiUrl;
        }

        public void setApiUrl(String apiUrl) {
            this.apiUrl = apiUrl;
        }
    }

    private static class StaticAuthHeaderRequestInterceptor implements RequestInterceptor {

        private String apiKey;

        public StaticAuthHeaderRequestInterceptor(String apiKey) {
            this.apiKey = apiKey;
        }

        @Override
        public void apply(RequestTemplate template) {
            template.header("X-API-KEY", apiKey);
        }

    }
}
