import Dispatcher from './Dispatcher';

class DispatcherClient extends Dispatcher {
    constructor(options) {
        super(options);

        const {
            stack
        } = options;

        // first render on client
        if (stack !== undefined) {
            this.firstRender = true;
            this.stack = stack;
            this.stackIndex = 0;
            this.afterFirstRenderCallbacks = [];
            this.dispatch = this.dispatchFirstRender.bind(this);
        } else {
            this.dispatch = this._dispatchWithCache.bind(this);
        }
    }

    endFirstRender() {
        this.dispatch = this._dispatchWithCache.bind(this);

        if (this.afterFirstRenderCallbacks.length) {
            for (let i = 0, l = this.afterFirstRenderCallbacks.length; i < l; i++) {
                this.afterFirstRenderCallbacks[i]();
            }
        }
    }

    dispatchFirstRender(event, payload) {
        if (event.action === undefined) {
            return this._dispatchWithCache(event, payload);
        }

        let needReexecute;
        let needDropCache;
        let result;
        let promiseResolve;
        let promiseReject;

        if (this.executionEnabled) {
            const fromStack = this.stack[this.stackIndex++];

            if (event.name === fromStack.name) {

                if (fromStack.status === 'resolved') {
                    result = Promise.resolve(event.rehydrate ? event.rehydrate(fromStack.payload) : fromStack.payload);
                } else if (fromStack.status === 'rejected') {
                    result = Promise.reject(fromStack.error);
                    needDropCache = true;
                } else {
                    result = new Promise((resolve, reject) => {
                        promiseResolve = resolve;
                        promiseReject = reject;
                    });
                    needReexecute = true;
                }

            } else {
                this.stack = [];
                debug.warn('Server and client stacks of dispatcher do not match! Server stack dropped');
            }
        } else {
            result = new Promise((resolve, reject) => {
                promiseResolve = resolve;
                promiseReject = reject;
            });
            needReexecute = true;
        }

        const cacheByName = this.cache[event.name] || (this.cache[event.name] = []);
        const cacheItem = {
            event,
            payload,
            result
        };

        cacheByName.push(cacheItem);

        if (needReexecute) {
            this.afterFirstRenderCallbacks.push(() => {
                this.dropCacheItem(cacheByName, cacheItem);
                this._dispatchWithCache(event, payload)
                    .then(promiseResolve, promiseReject);
            });
        }

        if (needDropCache) {
            this.afterFirstRenderCallbacks.push(() => {
                this.dropCacheItem(cacheByName, cacheItem);
            });
        }

        return this._dispatchWithCache(event, payload);
    }
}

export default DispatcherClient;
