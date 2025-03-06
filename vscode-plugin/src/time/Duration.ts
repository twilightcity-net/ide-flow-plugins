export class Duration {
    private seconds: number;

    constructor(seconds: number) {
        this.seconds = seconds;
    }

    getSeconds(): number {
        return this.seconds;
    }

    static between(start: Date, end: Date): Duration {
        const diffMs = end.getTime() - start.getTime();
        return new Duration(Math.floor(diffMs / 1000));
    }
} 