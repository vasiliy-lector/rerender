import Events from './Events';
import { shallowClone } from './utils';

class Store extends Events {
    constructor({ state = {}, dehydrate, rehydrate } = {}) {
        super();

        this.providedDehydrate = dehydrate;
        this.providedRehydrate = rehydrate;

        this.state = this.rehydrate(state);
        this.setState = this.setState.bind(this);
        this.getState = this.getState.bind(this);
    }

    dehydrate() {
        return this.providedDehydrate ? this.providedDehydrate(this.state) : this.state;
    }

    rehydrate(state) {
        return this.providedRehydrate ? this.providedRehydrate(state) : state;
    }

    getState(path, snapshot) {
        if (this.prevState && snapshot === true) {
            delete this.prevState;
        }

        if (path && Array.isArray(path)) {
            let result = this.state;

            for (let i = 0, l = path.length; result !== undefined && i < l; i++) {
                result = result[path[i]];
            }

            return result;
        } else {
            return this.state;
        }
    }

    setState(value, path) {
        if (path && Array.isArray(path)) {
            if (this.getState(path) !== value) {
                if (!this.prevState) {
                    this.prevState = this.state;
                    this.state = shallowClone(this.prevState);
                }

                let stateParent = this.state;
                let prevStateParent = this.prevState;
                let last = path.length - 1;

                for (let i = 0, l = last; i < l; i++) {
                    if (typeof prevStateParent[path[i]] === 'object'
                        && stateParent[path[i]] === prevStateParent[path[i]]) {
                        stateParent[path[i]] = shallowClone(prevStateParent[path[i]] || {});
                    } else {
                        stateParent[path[i]] = {};
                    }

                    stateParent = stateParent[path[i]];
                }

                stateParent[path[last]] = value;
                this.emit('change');
            }
        } else if (value !== this.state) {
            this.state = value;
            this.emit('change');
        }
    }
}

export default Store;
