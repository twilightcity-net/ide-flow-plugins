package net.twilightcity.flow.intellij;

public class Logger implements net.twilightcity.flow.Logger {

    public static final Logger INSTANCE = new Logger();

    com.intellij.openapi.diagnostic.Logger logger = com.intellij.openapi.diagnostic.Logger.getInstance("net.twilightcity");

    @Override
    public void debug(String message) {
        logger.debug(message);
    }

    @Override
    public void info(String message) {
        logger.info(message);
    }

    @Override
    public void warn(String message) {
        logger.warn(message);
    }

    @Override
    public void error(String message) {
        logger.error(message);
    }

    @Override
    public void error(String message, Throwable exception) {
        logger.error(message, exception);
    }

}
