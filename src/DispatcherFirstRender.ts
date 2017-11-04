import { Store } from './Store';
import { Dispatcher } from './Dispatcher';
import { NeverResolvePromise } from './NeverResolvePromise';
import { Promise } from './Promise';
import { deepEqual, noop } from './utils';

import {
    EventDefaults,
    Event,
    DispatcherCache,
    DispatcherCacheItem,
    DispatcherCacheDehydrated,
    DispatcherCacheItemDehydrated,
    Dispatch,
    Map
} from './types';

const crossUserCache: DispatcherCache & Map<any> = {};

type DispatcherFirstOptions = {
    eventDefaults?: EventDefaults,
    cacheFromServer: DispatcherCacheDehydrated,
    isServer?: boolean,
    crossUserCacheEnabled?: boolean
};
type CachedItem = {
    event: Event,
    payload: any,
    result: any
};

class DispatcherFirstRender<State = any> extends Dispatcher<State> {
    private dispatchOriginal: Dispatch;
    private setCacheOriginal: (event: Event, payload: any, result: any) => void;
    private getCachedOriginal: (event: Event, payload: any) => Promise<any> | void;
    private cacheFromServer: DispatcherCacheDehydrated;
    private crossUserCacheEnabled: boolean;
    private executionEnabled?: boolean;
    private catched: any[];

    constructor(store: Store<State>, {
        eventDefaults,
        cacheFromServer,
        isServer = false,
        crossUserCacheEnabled = isServer
    }: DispatcherFirstOptions) {
        super(store, {
            eventDefaults,
            hasInheritance: true
        });

        this.dispatchOriginal = this.dispatch;
        this.dispatch = this.dispatchInsideInit.bind(this);
        this.setActionOptions();

        this.setCacheOriginal = this.setCache;
        this.getCachedOriginal = this.getCached;

        if (isServer) {
            this.crossUserCacheEnabled = crossUserCacheEnabled;
            this.setCache = this.setCacheServer;
            this.getCached = this.getCachedServer;
        } else {
            this.cacheFromServer = cacheFromServer || {};
            this.setCache = this.setCacheOriginal;
            this.getCached = this.getCachedClient;
        }
    }

    public getCache() {
        return this.cache;
    }

    public dehydrate(): Map<CachedItem> {
        const dehydrated: Map<any> = {};

        for (const name in this.cache) {
            dehydrated[name] = [];

            for (let i = 0, l = this.cache[name].length; i < l; i++) {
                const item = this.cache[name][i];
                const value = item.result.getValue();

                dehydrated[name].push({
                    name: item.event.name,
                    payload: item.payload,
                    result: this.getEventSetting(item.event, 'dehydrate')
                        ? this.getEventSetting(item.event, 'dehydrate')(value)
                        : value
                });
            }
        }

        return dehydrated;
    }

    public beginCatch() {
        this.executionEnabled = true;
        this.catched = [];
    }

    public isCatched() {
        return this.catched.length > 0;
    }

    public endFirstRender() {
        delete this.cacheFromServer;
        this.setCache = this.setCacheOriginal;
        this.getCached = this.getCachedOriginal;
        this.dispatch = this.dispatchOriginal.bind(this);
        this.setActionOptions();
    }

    public waitCatched() {
        return new Promise<void>(resolve => {
            let settledCount = 0;
            const catched = this.catched;
            let catchCount = catched.length;

            const check = (item: CachedItem) => {
                if (item.result instanceof NeverResolvePromise) {
                    settledCount++;
                } else {
                    item.result.then(settle(item), settle());
                }
            };

            const settle = (item?: CachedItem) => () => {
                settledCount++;
                const newCatchedCount = catched.length;

                if (item && typeof item.event.action === 'function'
                    && this.getEventSetting(item.event, 'cache') && !this.getCachedOriginal(item.event, item.payload)) {
                    this.setCacheOriginal(item.event, item.payload, item.result);
                }

                if (catchCount < newCatchedCount) {
                    const newCatched = catched.slice(catchCount - newCatchedCount);
                    catchCount = newCatchedCount;

                    for (let i = 0, l = newCatched.length; i < l; i++) {
                        check(newCatched[i]);
                    }
                }

                if (catchCount <= settledCount) {
                    this.executionEnabled = false;
                    resolve(undefined);
                }
            };

            for (let i = 0; i < catchCount; i++) {
                check(catched[i]);
            }
        });
    }

    private getCachedClient(event: Event, payload: any): Promise<any> | void {
        const cached = this.getCachedOriginal(event, payload);

        if (cached) {
            return cached;
        }

        const cacheFromServer = this.cacheFromServer;

        if (cacheFromServer[event.name]
            && cacheFromServer[event.name].length > 0) {

            for (let i = 0, l = cacheFromServer[event.name].length; i < l; i++) {
                const cacheItem = cacheFromServer[event.name][i];

                if (cacheItem.name === event.name && deepEqual(cacheItem.payload, payload)) {

                    return Promise.resolve(this.getEventSetting(event, 'rehydrate')
                        ? this.getEventSetting(event, 'rehydrate')(cacheItem.result)
                        : cacheItem.result);
                }
            }
        }
    }

    private getCachedServer(event: Event, payload: any): any {
        const cached = this.getCachedOriginal(event, payload);

        if (cached) {
            return cached;
        }

        if (this.crossUserCacheEnabled && this.getEventSetting(event, 'crossUser')
            && crossUserCache[event.name] && crossUserCache[event.name].length) {

            for (let i = 0, l = crossUserCache[event.name].length; i < l; i++) {
                const cacheItem = crossUserCache[event.name][i];

                if (cacheItem.event === event && deepEqual(cacheItem.payload, payload)) {
                    return cacheItem.result;
                }
            }
        }
    }

    private setCacheServer(event: Event, payload: any, result: any): void {
        this.setCacheOriginal(event, payload, result);

        if (this.crossUserCacheEnabled && this.getEventSetting(event, 'crossUser')
            && !this.brokenCacheKeys[event.name]) {

            const cacheByName = crossUserCache[event.name] || (crossUserCache[event.name] = []);
            const item = {
                event,
                payload,
                result
            };

            cacheByName[event.name].push(item);

            const timeout = setTimeout(() => {
                this.dropCacheItem(cacheByName, item);
            }, this.getEventSetting(event, 'serverCacheAge'));

            result.catch(() => {
                clearTimeout(timeout);
                this.dropCacheItem(cacheByName, item);
            });
        }
    }

    private dispatchInsideInit(event: Event, payload: any) {
        if (!this.executionEnabled || this.getEventSetting(event, 'serverDisabled')) {
            return new NeverResolvePromise(noop);
        }

        const result = this.dispatchOriginal(event, payload);

        this.catched.push({
            event,
            payload,
            result
        });

        return result;
    }
}

export { DispatcherFirstRender };
