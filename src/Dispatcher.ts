import { deepEqual } from './utils';
import { Store } from './Store';
import { eventDefaults } from './defaults';
import { debug } from './debug';
import { Promise, isPromise } from './Promise';
import {
    ActionMethods,
    Dispatch,
    DispatcherCache,
    DispatcherCacheItem,
    Event,
    EventDefaults,
    GetState,
    Map,
    ReducerMethods,
    SetState
} from './types';

type Options = {
    cache?: DispatcherCache,
    eventDefaults?: EventDefaults & Map<any>,
    hasInheritance?: boolean,
    isServer?: boolean
};

export class Dispatcher {
    private cache: DispatcherCache;
    private brokenCacheKeys: {
        [name: string]: boolean
    };
    private eventDefaults: EventDefaults & Map<any>;
    private reducerOptions: ReducerMethods;
    private actionOptions: ActionMethods;
    private actionOptionsInsideCache: ActionMethods;

    constructor(private store: Store<any>, options: Options = {}) {
        this.cache = options.cache || {};
        this.brokenCacheKeys = {};

        if (options.eventDefaults) {
            this.eventDefaults = {};
            for (const name in eventDefaults) {
                this.eventDefaults[name] = options.eventDefaults[name] !== undefined
                    ? options.eventDefaults[name]
                    : eventDefaults[name];
            }
        } else {
            this.eventDefaults = eventDefaults;
        }

        this.reducerOptions = Object.freeze({
            getState: this.store.getState,
            setState: this.store.setState
        });

        if (!options.hasInheritance) {
            this.dispatch = this.dispatch.bind(this);
            this.setActionOptions();
        }
    }

    private setActionOptions() {
        this.actionOptions = Object.freeze({
            dispatch: this.dispatch,
            getState: this.store.getState
        });

        this.actionOptionsInsideCache = Object.freeze({
            dispatch: this.dispatchInsideCache.bind(this),
            getState: this.store.getState
        });
    }

    private getEventSetting(event: Event & Map<any>, name: string) {
        return event[name] !== undefined
            ? event[name]
            : this.eventDefaults[name];
    }

    private dispatchInsideCache(event: Event, payload: any): Promise<any> {
        if (event.reducers !== undefined) {
            debug.warn('Do not use dispatch (event with reducers) inside event with cache enabled! Event '
                + event.name + ' may not work correctly');
        }

        return this.dispatch(event, payload);
    }

    private dispatch(event: Event, payload: any): Promise<any> {
        return this.runAction(event, payload)
            .then(actionResult => {
                this.runReducers(event, actionResult);

                return actionResult;
            });
    }

    private runAction(event: Event, payload: any): Promise<any> {
        if (typeof event.action !== 'function') {
            return Promise.resolve(payload);
        }

        const cacheEnabled = this.getEventSetting(event, 'cache');

        if (cacheEnabled) {
            const cached = this.getCached(event, payload);

            if (cached !== undefined) {
                return cached;
            }

            const result = this.runActionPure(event, payload);

            this.setCache(event, payload, result);

            return result;
        }

        return this.runActionPure(event, payload);
    }

    private runActionPure(event: Event, payload: any): Promise<any> {
        const actionResult = event.action && event.action(
            this.getEventSetting(event, 'cache')
                ? this.actionOptions
                : this.actionOptionsInsideCache,
            payload
        );

        if (isPromise(actionResult)) {
            return actionResult;
        } else {
            return Promise.resolve(actionResult);
        }
    }

    private runReducers(event: Event, payload: any): void {
        if (!event.reducers || !event.reducers.length) {
            return;
        }

        for (let i = 0, l = event.reducers.length; i < l; i++) {
            event.reducers[i](this.reducerOptions, payload);
        }
    }

    private getCached(event: Event, payload: any): any {
        if (this.cache[event.name]) {
            for (let i = 0, l = this.cache[event.name].length; i < l; i++) {
                const cacheItem = this.cache[event.name][i];
                if (cacheItem.event !== event) {
                    this.brokenCacheKeys[event.name] = true;
                    debug.warn('There are many events with same name '
                        + event.name + '. Cache for this key will not work!');
                } else if (deepEqual(cacheItem.payload, payload)) {
                    return cacheItem.result;
                }
            }
        }
    }

    private setCache(event: Event, payload: any, result: any): void {
        if (this.brokenCacheKeys[event.name]) {
            return;
        }
        const cacheByName = this.cache[event.name] || (this.cache[event.name] = []);
        const item = {
            event,
            payload,
            result
        };

        cacheByName.push(item);

        result.catch(() => this.dropCacheItem(cacheByName, item));
    }

    private dropCacheItem(cacheByName: DispatcherCacheItem[], item: DispatcherCacheItem) {
        for (let i = 0, l = cacheByName.length; i < l; i++) {
            if (cacheByName[i] === item) {
                cacheByName.splice(i, 1);

                return;
            }
        }
    }
}
