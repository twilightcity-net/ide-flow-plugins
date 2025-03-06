import * as assert from 'assert';
import { LastLocationTracker } from '../../action/LastLocationTracker';

suite('LastLocationTracker Tests', () => {
    let tracker: LastLocationTracker;

    setup(() => {
        tracker = new LastLocationTracker();
    });

    test('should track location updates', () => {
        // Arrange
        const filePath = '/test/file.ts';
        const module = 'testModule';

        // Act
        tracker.updateLocation(filePath, module);

        // Assert
        assert.strictEqual(tracker.getLastFilePath(), filePath);
        assert.strictEqual(tracker.getLastModule(), module);
    });

    test('should clear location', () => {
        // Arrange
        tracker.updateLocation('/test/file.ts', 'testModule');

        // Act
        tracker.clear();

        // Assert
        assert.strictEqual(tracker.getLastFilePath(), null);
        assert.strictEqual(tracker.getLastModule(), null);
    });

    test('should handle null values', () => {
        // Act
        tracker.updateLocation(null, null);

        // Assert
        assert.strictEqual(tracker.getLastFilePath(), null);
        assert.strictEqual(tracker.getLastModule(), null);
    });
}); 