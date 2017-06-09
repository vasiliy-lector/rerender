import Promise from './Promise';

export default class NeverResolvePromise extends Promise {
    constructor() {
        super(() => {});
    }

    then() {
        return this;
    }

    catch() {
        return this;
    }
}
