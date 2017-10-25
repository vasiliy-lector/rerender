import { Promise } from './Promise';

export class NeverResolvePromise extends Promise<any> {
    constructor(fn: any) {
        super(() => {});
    }

    public then(onResolve: any, onRejected?: any) {
        return this;
    }

    public catch(onReject: any) {
        return this;
    }
}
