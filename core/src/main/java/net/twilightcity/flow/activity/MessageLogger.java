package net.twilightcity.flow.activity;


public interface MessageLogger {

    void flush();

    void writeMessage(Object message);

}
