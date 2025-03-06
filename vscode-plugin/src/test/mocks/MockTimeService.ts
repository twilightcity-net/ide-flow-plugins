export class MockTimeService {
    private currentTime: Date;

    constructor() {
        this.currentTime = new Date();
    }

    now(): Date {
        return new Date(this.currentTime);
    }

    setCurrentTime(time: Date): void {
        this.currentTime = new Date(time);
    }

    advanceTime(milliseconds: number): void {
        this.currentTime = new Date(this.currentTime.getTime() + milliseconds);
    }
} 