import * as assert from 'assert';
import { ActivityHandler } from '../../activity/ActivityHandler';
import { MessageQueue } from '../../activity/MessageQueue';
import { TimeService } from '../../time/TimeService';
import { MockMessageQueue } from '../mocks/MockMessageQueue';
import { MockTimeService } from '../mocks/MockTimeService';

suite('ActivityHandler Tests', () => {
    let messageQueue: MockMessageQueue;
    let timeService: MockTimeService;
    let activityHandler: ActivityHandler;

    setup(() => {
        messageQueue = new MockMessageQueue();
        timeService = new MockTimeService();
        activityHandler = new ActivityHandler(messageQueue as any, timeService);
    });

    test('should track file activity over minimum threshold', () => {
        // Arrange
        const moduleName = 'testModule';
        const filePath = '/test/path/file.ts';
        timeService.setCurrentTime(new Date('2024-01-01T10:00:00'));

        // Act
        activityHandler.startFileEvent(moduleName, filePath);
        timeService.advanceTime(5000); // 5 seconds
        activityHandler.startFileEvent(moduleName, '/test/path/other.ts');

        // Assert
        assert.strictEqual(messageQueue.editorActivities.length, 1);
        const activity = messageQueue.editorActivities[0];
        assert.strictEqual(activity.durationInSeconds, 5);
        assert.strictEqual(activity.module, moduleName);
        assert.strictEqual(activity.filePath, filePath);
        assert.strictEqual(activity.modified, false);
    });

    test('should track file modifications', () => {
        // Arrange
        const filePath = '/test/path/file.ts';
        timeService.setCurrentTime(new Date('2024-01-01T10:00:00'));

        // Act
        activityHandler.startFileEvent('testModule', filePath);
        activityHandler.fileModified(filePath);
        timeService.advanceTime(5000);
        activityHandler.startFileEvent('testModule', '/test/path/other.ts');

        // Assert
        assert.strictEqual(messageQueue.editorActivities.length, 1);
        const activity = messageQueue.editorActivities[0];
        assert.strictEqual(activity.modified, true);
    });

    test('should track external activity', () => {
        // Arrange
        const idleDuration = 10;
        const comment = 'Editor Deactivated';

        // Act
        activityHandler.markExternalActivity(idleDuration, comment);

        // Assert
        assert.strictEqual(messageQueue.externalActivities.length, 1);
        const activity = messageQueue.externalActivities[0];
        assert.strictEqual(activity.durationInSeconds, idleDuration);
        assert.strictEqual(activity.comment, comment);
    });
}); 