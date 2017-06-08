import { deepEqual } from './utils';
import { debug } from './debug';
import NeverResolvePromise from './NeverResolvePromise';

const betweenUserCache = {};
const maxAge = 600000;

function Dispatcher({ store, stack = [], firstRender, isServer = false, betweenUserCacheEnabled = true }) {
    this.warmUp = true;
    this.store = store;
    this.isServer = isServer;
    this.betweenUserCacheEnabled = betweenUserCacheEnabled;
    this.dispatch = isServer
        ? this.dispatchServer.bind(this)
        : firstRender
            ? this.dispatchFirstRender.bind(this)
            : this._dispatchWithCache.bind(this);

    // user cache
    this.cache = {};

    this.stack = stack;

    if (firstRender) {
        this.stackIndex = 0;
        this.afterFirstRenderCallbacks = [];
    }

    this.actionOptions = Object.freeze({
        dispatch: this.dispatch,
        getState: store.getState
    });
    this.reducerOptions = Object.freeze({
        getState: store.getState,
        setState: store.setState
    });
}

Dispatcher.prototype = {
    dehydrate() {
        const deduplicate = {};

        return this.stack.map(item => {
            const deduplicateByName = deduplicate[item.name] || (deduplicate[item.name] = []);

            for (let i = 0, l = deduplicateByName.length; i < l; i++) {
                if (deduplicateByName[i] === item.promise) {
                    return {
                        name: item.name,
                        status: item.status,
                        duplicate: true
                    };
                }
            }

            deduplicateByName.push(item.promise);

            return {
                name: item.name,
                status: item.status,
                payload: item.payload,
                error: item.error
            };
        });
    },

    stopWarmUp() {
        this.warmUp = false;
    },

    beginCatch() {
        this.executionEnabled = true;
        this.beginCatchCount = this.stack.length;
    },

    endCatch() {
        this.executionEnabled = false;
        this.endCatchCount = this.stack.length;
    },

    waitCatched() {
        const beginCatchCount = this.beginCatchCount;
        const endCatchCount = this.endCatchCount;
        const catchCount = endCatchCount - beginCatchCount;

        if (catchCount === 0) {
            return;
        }

        const catched = this.stack.slice(-catchCount);

        return new Promise(resolve => {
            let settledCount = 0;
            const settle = () => {
                settledCount++;
                if (catchCount <= settledCount) {
                    resolve();
                }
            };

            for (let i = 0; i < catchCount; i++) {
                if (catched[i].promise instanceof NeverResolvePromise) {
                    settledCount++;
                } else {
                    catched[i].promise.then(settle, settle);
                }
            }
        });
    },

    dispatchServer(event, payload) {
        if (this.warmUp) {
            return event.serverDisabled ? Promise.reject() : this._dispatchWithCache(event, payload);
        }

        const promise = this.executionEnabled && !event.serverDisabled
            ? this._dispatchWithCache(event, payload)
            : new NeverResolvePromise();

        const index = this.stack.push({
            name: event.name,
            promise,
            status: 'pending'
        }) - 1;

        promise.then(payload => {
            this.stack[index].status = 'resolved';
            this.stack[index].payload = event.dehydrate ? event.dehydrate(payload) : payload;
        }, error => {
            this.stack[index].status = 'rejected';
            this.stack[index].error = error;
        });

        return promise;
    },

    endFirstRender() {
        this.dispatch = this._dispatchWithCache.bind(this);
        this.actionOptions = Object.freeze({
            dispatch: this.dispatch,
            getState: this.actionOptions.getState
        });

        if (this.afterFirstRenderCallbacks.length) {
            for (let i = 0, l = this.afterFirstRenderCallbacks.length; i < l; i++) {
                this.afterFirstRenderCallbacks[i]();
            }
        }
    },

    dispatchFirstRender(event, payload) {
        const fromStack = this.stack[this.stackIndex++];

        if (event.name === fromStack.name) {
            const cacheByName = this.cache[event.name] || (this.cache[event.name] = []);
            let result;
            let needReexecute;

            if (fromStack.status === 'fulfilled') {
                result = Promise.resolve(event.rehydrate ? event.rehydrate(fromStack.payload) : fromStack.payload);
            } else if (fromStack.status === 'rejected') {
                result = Promise.reject(fromStack.error);
                needReexecute = true;
            } else {
                result = new NeverResolvePromise();
                needReexecute = true;
            }

            const cacheItem = {
                event,
                payload,
                result
            };

            cacheByName.push(cacheItem);

            if (needReexecute) {
                this.afterFirstRenderCallbacks.push(() => {
                    this.dropCacheItem(cacheByName, cacheItem);
                    this._dispatchWithCache(event, payload);
                });
            }
        } else {
            this.stack = [];
            debug.warn('Server and client stacks of dispatcher do not match! Server stack dropped');
        }

        return this._dispatchWithCache(event, payload);
    },

    _dispatchWithCache(event, payload) {
        let cache;
        const hasCache = event.cache && event.name !== undefined;

        if (hasCache) {
            if (this.isServer && this.betweenUserCacheEnabled && event.userIndependent) {
                cache = betweenUserCache;
            } else {
                cache = this.cache;
            }

            const cached = this.getCached(cache, event, payload);

            if (cached !== undefined) {
                return cached;
            }
        }

        const result = this._dispatchPure(event, payload);

        if (hasCache) {
            const cacheItem = {
                event,
                payload,
                result
            };

            const cacheByName = cache[event.name] || (cache[event.name] = []);
            cacheByName.push(cacheItem);
            let timeout;

            if (!this.isServer || cache === betweenUserCache) {
                timeout = setTimeout(() => this.dropCacheItem(cacheByName, cacheItem), event.maxAge || maxAge);
            }

            result.catch(error => {
                this.dropCacheItem(cacheByName, cacheItem);

                if (timeout !== undefined) {
                    clearTimeout(timeout);
                }

                return Promise.reject(error);
            });
        }

        return result;
    },

    _dispatchPure(event, payload) {
        if (typeof event.action !== 'function') {
            this.runReducers(event, payload);

            return Promise.resolve(payload);
        }

        return this.runAction(event, payload).then(actionResult => {
            this.runReducers(event, actionResult);

            return actionResult;
        });
    },

    getCached(cache, event, payload) {
        if (cache[event.name] === undefined) {
            return;
        }

        for (let i = 0, l = cache[event.name].length; i < l; i++) {
            const cacheItem = cache[event.name][i];
            if (cacheItem.event === event && deepEqual(cacheItem.payload, payload)) {
                return cacheItem.result;
            }
        }
    },

    dropCacheItem(cacheByName, item) {
        for (let i = 0, l = cacheByName.length; i < l; i++) {
            if (cacheByName[i] === item) {
                cacheByName.splice(i, 1);

                return;
            }
        }
    },

    runAction(event, payload) {
        const actionResult = event.action(this.actionOptions, payload);

        if (actionResult && actionResult instanceof Promise) {
            return actionResult;
        } else {
            return Promise.resolve(actionResult);
        }
    },

    runReducers(event, payload) {
        if (this.warmUp || !event.reducers || !event.reducers.length) {
            return;
        }

        for (let i = 0, l = event.reducers.length; i < l; i++) {
            event.reducers[i](this.reducerOptions, payload);
        }
    },

    setIsServer() {
        this.isServer = true;
    }
};

export default Dispatcher;
