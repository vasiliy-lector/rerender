export default class NeverResolvePromise extends Promise {
    then() {
        return this;
    }

    catch() {
        return this;
    }
}
