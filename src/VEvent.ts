export class VEvent {
    private stopped: boolean = false;

    constructor(public name: string, public payload?: any) {}

    stopPropagation(): void {
        this.stopped = true;
    }

    isStopped(): boolean {
        return this.stopped;
    }
}
