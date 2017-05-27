import { shallowClone } from './utils';

class Component {
    constructor(props, children, { events, id, dispatch }) {
        this._events = events;
        this._id = id;
        this.dispatch = dispatch;
        this.state = {};
        this.props = props;
        this.children = children;
    }

    getState(path, snapshot) {
        if (this._prevState && snapshot) {
            delete this._prevState;
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
            if (this.getState(path, false) !== value) {
                if (!this._prevState) {
                    this._prevState = this.state;
                    this.state = shallowClone(this._prevState);
                }

                let stateParent = this.state;
                let prevStateParent = this._prevState;
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
                this._events.emit('rerender-one', this._id);
            }
        } else if (value && typeof value === 'object'){
            Object.keys(value).forEach(path => this.setState(value[path], [path]));
        }
    }

    render() {
        return;
    }
}

export default Component;
