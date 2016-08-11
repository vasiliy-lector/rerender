class Action {
    constructor({ store, payload }) {
        let promise;

        this.store = store;

        promise = new Promise((resolve, reject) => this.execute({
            payload,
            resolve,
            reject,
            store
        }));

        return promise;
    }

    execute() {
        throw new Error('Default execute not implemented');
    }
}

export default Action;
