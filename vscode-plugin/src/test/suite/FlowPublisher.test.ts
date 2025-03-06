import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { FlowPublisher } from '../../activity/FlowPublisher';
import { Logger } from '../../Logger';
import { TimeService } from '../../time/TimeService';
import { MockTimeService } from '../mocks/MockTimeService';

suite('FlowPublisher Tests', () => {
    let tempDir: string;
    let publisher: FlowPublisher;
    let timeService: MockTimeService;

    setup(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'flow-test-'));
        timeService = new MockTimeService();
        const logger = new Logger();
        publisher = new FlowPublisher(tempDir, logger, timeService);
    });

    teardown(() => {
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    test('should create required directories on initialization', () => {
        assert.strictEqual(fs.existsSync(path.join(tempDir, 'publish')), true);
        assert.strictEqual(fs.existsSync(path.join(tempDir, 'failed')), true);
        assert.strictEqual(fs.existsSync(path.join(tempDir, 'retryNextSession')), true);
    });

    test('should move active file to publish directory on start', () => {
        // Arrange
        const activeFile = path.join(tempDir, 'active.flow');
        fs.writeFileSync(activeFile, 'test content');
        timeService.setCurrentTime(new Date('2024-01-01T10:00:00'));

        // Act
        publisher.start();

        // Assert
        assert.strictEqual(fs.existsSync(activeFile), false);
        const publishFiles = fs.readdirSync(path.join(tempDir, 'publish'));
        assert.strictEqual(publishFiles.length, 1);
    });

    test('should handle failed directory creation gracefully', () => {
        // Arrange
        const readOnlyDir = path.join(os.tmpdir(), 'read-only-dir');
        fs.mkdirSync(readOnlyDir);
        fs.chmodSync(readOnlyDir, 0o444);

        // Act & Assert
        assert.doesNotThrow(() => {
            new FlowPublisher(readOnlyDir, new Logger(), timeService);
        });
    });

    test('should handle file move failures', () => {
        // Arrange
        const activeFile = path.join(tempDir, 'active.flow');
        fs.writeFileSync(activeFile, 'test content');
        fs.chmodSync(path.join(tempDir, 'publish'), 0o444);

        // Act & Assert
        assert.doesNotThrow(() => {
            publisher.start();
        });
    });

    test('should handle concurrent access to publishing lock', async () => {
        // Arrange
        const lockFile = path.join(tempDir, 'publishing.lock');
        fs.writeFileSync(lockFile, 'locked');

        // Act
        publisher.start();

        // Assert - should not throw and should wait for lock
        assert.strictEqual(fs.existsSync(lockFile), true);
    });
}); 