import Events from './Events';
import { debug, isSameProps } from './utils';

class Store extends Events {
    constructor({ state = {}, dehydrate, rehydrate } = {}) {
        super();

        this.providedDehydrate = dehydrate;
        this.providedRehydrate = rehydrate;

        this.state = this.rehydrate(state);
        this.setState = this.setState.bind(this);
    }

    dehydrate() {
        return this.providedDehydrate ? this.providedDehydrate(this.state) : this.state;
    }

    rehydrate(state) {
        return this.providedRehydrate ? this.providedRehydrate(state) : state;
    }

    setState(changes) {
        if (typeof changes !== 'object') {
            debug.error(`Store method setState required object, but ${typeof changes} was given`);
            return;
        }

        let reallyChanged = Object.keys(changes).reduce((memo, key) => {
                if (!this.state[key] || !isSameProps(changes[key], this.state[key])) {
                    memo[key] = changes[key];
                } else {
                    debug.warn(`Store setState: value with property "${key}" of new state is same as previous. So event with name "${key}" will not triggered. It is recommended to transfer only the changed values and do not mutate objects.`);
                }

                return memo;
            }, {}),
            reallyChangedKeys = Object.keys(reallyChanged);

        if (reallyChangedKeys.length) {
            this.state = Object.assign({}, this.state, changes);
            reallyChangedKeys.forEach(key => this.emit(key));
            this.emit('change');
            debug.log('New state', this.state);
        }
    }
}

export default Store;
