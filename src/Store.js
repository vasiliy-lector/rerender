import Events from './Events';
import { isSameProps } from './utils';
import { debug } from './debug';

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
            // FIXME: no Object.assign
            this.state = Object.assign({}, this.state, changes);
            reallyChangedKeys.forEach(key => this.emit(key));
            this.emit('change');
            debug.log('New state', this.state);
        }
    }
}

export default Store;
