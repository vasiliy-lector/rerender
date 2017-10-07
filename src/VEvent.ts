export class VEvent {
    private stopped: boolean = false;

    constructor(public name: string, public payload?: any) {}

    public stopPropagation(): void {
        this.stopped = true;
    }

    public isStopped(): boolean {
        return this.stopped;
    }
}
