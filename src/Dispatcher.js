import { deepEqual } from './utils';

const betweenUserCache = {};
const maxAge = 600000;

function Dispatcher({ store, server = false, betweenUserCacheEnabled = true }) {
    this.store = store;
    this.isServer = server;
    this.betweenUserCacheEnabled = betweenUserCacheEnabled;
    this.dispatch = this.dispatch.bind(this);
    // user cache
    this.cache = {};

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
    dehydrate() {},
    dispatch(event, payload) {
        if ((this.isServer && event.serverDisabled) || (!this.isServer && event.clientDisabled)) {
            return Promise.reject();
        }

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

        const result = this._dispatchNoCache(event, payload);

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

    _dispatchNoCache(event, payload) {
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
        if (!event.reducers || !event.reducers.length) {
            return;
        }

        for (let i = 0, l = event.reducers.length; i < l; i++) {
            event.reducers[i](this.reducerOptions, payload);
        }
    },

    setServer() {
        this.isServer = true;
    }
};

export default Dispatcher;
