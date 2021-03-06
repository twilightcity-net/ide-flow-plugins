package net.twilightcity.flow.activity

import net.twilightcity.gridtime.api.flow.activity.NewEditorActivityDto
import net.twilightcity.gridtime.api.flow.activity.NewExecutionActivityDto
import net.twilightcity.gridtime.api.flow.activity.NewModificationActivityDto
import net.twilightcity.flow.controller.IFMController
import net.twilightcity.time.MockTimeService
import spock.lang.Ignore
import spock.lang.Specification

class TestActivityHandler extends Specification {

    private static final int PERSISTABLE_ACTIVITY_DURATION_SECONDS = ActivityHandler.SHORTEST_ACTIVITY + 1
    private static final int DOES_NOT_PERSIST_ACTIVITY_DURATION_SECONDS = ActivityHandler.SHORTEST_ACTIVITY - 1

    ActivityHandler handler
    InMemoryMessageLogger messageLogger
    IFMController controller = Mock(IFMController)
    MockTimeService timeService = new MockTimeService()

    void setup() {
        messageLogger = new InMemoryMessageLogger()
        MessageQueue activityQueue = new MessageQueue(messageLogger, timeService)
        handler = new ActivityHandler(controller, activityQueue, timeService)

        controller.isActive() >> true
    }

    void testStartEvent_ShouldNotCreateEditorActivity_IfNoPriorEvent() {
        when:
        handler.startFileEvent("module","file")

        then:
        assertNoMessages()
    }

    void testStartEvent_ShouldNotCreateEditorActivity_IfSameEvent() {
        when:
        handler.startFileEvent("module", "file")
        timeService.plusSeconds(PERSISTABLE_ACTIVITY_DURATION_SECONDS)
        handler.startFileEvent("module", "file")

        then:
        assertNoMessages()
    }

    void testStartEvent_ShouldCreateEditorActivity_IfDifferentEvent() {
        when:
        handler.startFileEvent("module", "file")
        timeService.plusSeconds(PERSISTABLE_ACTIVITY_DURATION_SECONDS)
        handler.startFileEvent("module", "other")

        then:
        assert getMessage(0, NewEditorActivityDto).filePath == "file"

        assert getMessage(0, NewEditorActivityDto).durationInSeconds == PERSISTABLE_ACTIVITY_DURATION_SECONDS
        assertMessageCount(1)
    }

    void testStartEvent_ShouldNotCreateEditorActivity_IfShortDelay() {
        when:
        handler.startFileEvent("module", "file")
        timeService.plusSeconds(DOES_NOT_PERSIST_ACTIVITY_DURATION_SECONDS)
        handler.startFileEvent("module", "other")

        then:
        assertNoMessages()
    }

    void testStartEvent_ShouldEndCurrentEvent_IfNull() {
        when:
        handler.startFileEvent("module", "file")
        timeService.plusSeconds(PERSISTABLE_ACTIVITY_DURATION_SECONDS)
        handler.startFileEvent(null, null)

        then:
        assert getMessage(0, NewEditorActivityDto).filePath == "file"
        assertMessageCount(1)
    }

    void testEndEvent_ShouldEndCurrentEvent_IfSameEvent() {
        when:
        handler.startFileEvent("module", "file")
        timeService.plusSeconds(PERSISTABLE_ACTIVITY_DURATION_SECONDS)
        handler.endFileEvent("file")

        then:
        assert getMessage(0, NewEditorActivityDto).filePath == "file"
        assert getMessage(0, NewEditorActivityDto).durationInSeconds == PERSISTABLE_ACTIVITY_DURATION_SECONDS
        assertMessageCount(1)
    }

    void testEndEvent_ShouldNotEndCurrentEvent_IfDifferentEvent() {
        when:
        handler.startFileEvent("module", "file")
        timeService.plusSeconds(PERSISTABLE_ACTIVITY_DURATION_SECONDS)
        handler.endFileEvent("other")

        then:
        assertNoMessages()
    }

    void testEndEvent_ShouldEndCurrentEvent_IfNull() {
        when:
        handler.startFileEvent("module", "file")
        timeService.plusSeconds(PERSISTABLE_ACTIVITY_DURATION_SECONDS)
        handler.endFileEvent(null)

        then:
        assertMessageCount(1)
    }

    void testEndEvent_ShouldNotCreateEditorActivityWithModifiedTrue_IfActiveEventModifiedNotCalled() {
        when:
        handler.startFileEvent("module", "file")
        timeService.plusSeconds(PERSISTABLE_ACTIVITY_DURATION_SECONDS)
        handler.endFileEvent(null)

        then:
        assert getMessage(0, NewEditorActivityDto).modified == false
        assertMessageCount(1)
    }

    void testEndEvent_ShouldCreateEditorActivityWithModifiedTrue_IfActiveEventModifiedCalled() {
        when:
        handler.startFileEvent("module", "file")
        timeService.plusSeconds(PERSISTABLE_ACTIVITY_DURATION_SECONDS)
        handler.fileModified("file")
        handler.endFileEvent(null)

        then:
        assert getMessage(0, NewEditorActivityDto).modified == true
        assertMessageCount(1)
    }

    void testPushModificationActivity_ShouldCountModifications() {
        when:
        handler.fileModified("file")
        handler.fileModified("file")
        handler.fileModified("file")
        handler.pushModificationActivity(30)
        then:
        assert getMessage(0, NewModificationActivityDto).modificationCount == 3
    }

    void testMarkProcessExecution_ShouldPublishActivity_AfterStartStop() {
        when:
        handler.markProcessStarting(3, "TestMyUnit", "JUnit", true)
        handler.markProcessEnding(3, -12)
        then:
        assert getMessage(0, NewExecutionActivityDto).processName == "TestMyUnit"
        assert getMessage(0, NewExecutionActivityDto).executionTaskType == "JUnit"
        assert getMessage(0, NewExecutionActivityDto).exitCode == -12
        assert getMessage(0, NewExecutionActivityDto).isDebug() == true

    }

    // TODO: the previous implementation held onto the active event, which made it possible to adjust the prior event
    // this is not possible with the current implementation since the events could be published at any point... this means
    // we could be sending contiguous events of the same name to the server - probably need to account for this on the
    // server side - could also account for this in the timeline and just collapse events there
    @Ignore
    void testDuplicateEvents_ShouldIncrementDurationOnExistingEditorActivityAndNotCreateNewActivity_IfShortActivityComesBetweenTwoSameActivities() {
        when:
        handler.startFileEvent("module", "file1")
        timeService.plusSeconds(PERSISTABLE_ACTIVITY_DURATION_SECONDS)
        handler.startFileEvent("module", "file2")
        timeService.plusSeconds(DOES_NOT_PERSIST_ACTIVITY_DURATION_SECONDS)
        handler.startFileEvent("module", "file3")
        timeService.plusSeconds(PERSISTABLE_ACTIVITY_DURATION_SECONDS)
        handler.endFileEvent(null)

        then:
        assert getMessage(0, NewEditorActivityDto).filePath == "file1"
        assert getMessage(0, NewEditorActivityDto).durationInSeconds == PERSISTABLE_ACTIVITY_DURATION_SECONDS * 2
        assertMessageCount(1)
    }

    void testDuplicateEvents_ShouldCreateNewEvent_IfShortActivityComesBetweenTwoActivitiesWithSameNameButDifferentInModifiedState() {
        when:
        handler.startFileEvent("module", "file1")
        timeService.plusSeconds(PERSISTABLE_ACTIVITY_DURATION_SECONDS)
        handler.startFileEvent("module", "file2")
        timeService.plusSeconds(DOES_NOT_PERSIST_ACTIVITY_DURATION_SECONDS)
        handler.startFileEvent("module", "file3")
        timeService.plusSeconds(PERSISTABLE_ACTIVITY_DURATION_SECONDS)
        handler.fileModified("file1")
        handler.endFileEvent(null)

        then:
        assert getMessage(0, NewEditorActivityDto).filePath == "file1"
        assert getMessage(0, NewEditorActivityDto).durationInSeconds == PERSISTABLE_ACTIVITY_DURATION_SECONDS
        assert getMessage(1, NewEditorActivityDto).filePath == "file3"
        assert getMessage(1, NewEditorActivityDto).durationInSeconds == PERSISTABLE_ACTIVITY_DURATION_SECONDS
        assertMessageCount(2)
    }


    private void assertNoMessages() {
        assert messageLogger.messages.size() == 0
    }

    private void assertMessageCount(int expectedSize) {
        assert messageLogger.messages.size() == expectedSize
    }

    private <T> T getMessage(int index, Class<T> clazz) {
        assert messageLogger.messages.size() > index
        (T) messageLogger.messages[index]
    }

}
