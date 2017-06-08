import { shallowClone } from './utils';
import Events from './Events';
import VEvent from './VEvent';
import debug from './debug';
import VComponent from './VComponent';

class Component extends Events {
    constructor(props, children, options, id) {
        super();
        this._options = options;
        this._id = id;
        this.state = {};
        this.props = props;
        this.children = children;
    }

    getState(path, snapshot) {
        if (this._prevState && snapshot === true) {
            delete this._prevState;
        }

        if (path && Array.isArray(path)) {
            var result = this.state;

            for (var i = 0, l = path.length; result !== undefined && i < l; i++) {
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
                if (!this._prevState) {
                    this._prevState = this.state;
                    this.state = shallowClone(this._prevState);
                }

                var stateParent = this.state;
                var prevStateParent = this._prevState;
                var last = path.length - 1;

                for (var i = 0, l = last; i < l; i++) {
                    if (prevStateParent && typeof prevStateParent[path[i]] === 'object') {
                        if (stateParent[path[i]] === prevStateParent[path[i]]) {
                            stateParent[path[i]] = shallowClone(prevStateParent[path[i]]);
                        }
                        prevStateParent = prevStateParent[path[i]] || undefined;
                    } else {
                        stateParent[path[i]] = typeof path[i + 1] === 'number' ? [] : {};
                    }

                    stateParent = stateParent[path[i]];
                }

                stateParent[path[last]] = value;

                if (this._componentMounted && !this._settingProps) {
                    this._options.events.emit('rerender-one', this._id);
                }
            }
        } else if (value && typeof value === 'object'){
            Object.keys(value).forEach(path => this.setState(value[path], [path]));
        }
    }

    dispatch() {
        this._options.dispatch.apply(null, arguments);
    }

    trigger(eventName, payload) {
        if (this._componentMounted) {
            var event = new VEvent(eventName, payload);
            var parent = this.getParent();
            while (parent && !event.isStopped()) {
                if (parent instanceof VComponent && parent.ref) {
                    parent.ref.emit(eventName, event);
                }

                parent = parent.getParent();
            }
        } else {
            debug.warn('Try emit event on unmounted component, event not triggered');
        }
    }

    getParent() {
        return this._options.getParent(this._id);
    }

    render() {
        return;
    }
}

export default Component;
