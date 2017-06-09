const PENDING = 'pending';
const RESOLVED = 'resolved';
const REJECTED = 'rejected';
const STATUS = '[[PromiseStatus]]';
const VALUE = '[[PromiseValue]]';
const RESOLVE = '[[PromiseResolve]]';
const REJECT = '[[PromiseReject]]';

function Promise(fn) {
    try {
        fn(this[RESOLVE].bind(this), this[REJECT].bind(this));
    } catch (error) {
        this[REJECT](error);
    }
}

Promise.prototype = {
    then(onFulfilled = identity, onRejected = identity) {
        if (this[STATUS] === RESOLVED) {
            const result = onFulfilled(this[VALUE]);

            if (isPromise(result)) {
                return result;
            } else {
                return Promise.resolve(result);
            }
        } else if (this[STATUS] === REJECTED) {
            return Promise.reject(onRejected(this[VALUE]));
        } else {
            return new Promise((resolve, reject) => {
                (this._fulfilledCalbacks || (this._fulfilledCalbacks = [])).push(payload => {
                    const result = onFulfilled(payload);

                    if (isPromise(result)) {
                        result.then(resolve, reject);
                    } else {
                        resolve(result);
                    }
                });

                (this._rejectedCalbacks || (this._rejectedCalbacks = [])).push(error => reject(onRejected(error)));
            });
        }
    },

    catch(onRejected = identity) {
        if (this[STATUS] === REJECTED) {
            return Promise.reject(onRejected(this[VALUE]));
        } else if (this[STATUS] === PENDING) {
            return new Promise((resolve, reject) => {
                (this._rejectedCalbacks || (this._rejectedCalbacks = [])).push(error => reject(onRejected(error)));
            });
        } else {
            return this;
        }
    },

    [STATUS]: PENDING,

    [RESOLVE]: function(payload) {
        if (this[STATUS] === PENDING) {
            this[STATUS] = RESOLVED;
            this[VALUE] = payload;

            if (this._fulfilledCalbacks) {
                for (let i = 0, l = this._fulfilledCalbacks.length; i < l; i++) {
                    this._fulfilledCalbacks[i](payload);
                }
            }
        }
    },

    [REJECT]: function(error) {
        if (this[STATUS] === PENDING) {
            this[STATUS] = REJECTED;
            this[VALUE] = error;

            if (this._rejectedCalbacks) {
                for (let i = 0, l = this._rejectedCalbacks.length; i < l; i++) {
                    this._rejectedCalbacks[i](error);
                }
            }
        }
    }
};

Promise.resolve = payload => {
    return new Promise(resolve => resolve(payload));
};

Promise.reject = error => {
    return new Promise((resolve, reject) => reject(error));
};

function isPromise(payload) {
    return payload instanceof Promise
        || (payload !== null && typeof payload === 'object'
        && typeof payload.then === 'function' && typeof payload.catch === 'function');
}

function identity(payload) {
    return payload;
}

export default Promise;
