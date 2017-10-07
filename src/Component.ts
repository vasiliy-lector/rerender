import { shallowClone } from './utils';
import { Events } from './Events';
import { VEvent } from './VEvent';
import { debug } from './debug';
import { VComponent } from './VComponent';

export class Component<Props, State> extends Events {
    _settingProps: boolean = false;
    _componentMounted: boolean = false;
    private prevState: Partial<State>;
    protected state: Partial<State> = {};

    constructor(private props: Props, private options: any, private id: string) {
        super();
    }

    getStateSnapshot(path?: string[]): any {
        if (this.prevState) {
            delete this.prevState;
        }

        return this.getState(path);
    }

    getState(path?: string[]): any {
        if (path && Array.isArray(path)) {
            let result: any = this.state;

            for (let i = 0, l = path.length; result !== undefined && i < l; i++) {
                result = result[path[i]];
            }

            return result;
        } else {
            return this.state;
        }
    }

    setState(value: any, path?: string[]): void {
        if (path && Array.isArray(path)) {
            if (this.getState(path) !== value) {
                if (!this.prevState) {
                    this.prevState = this.state;
                    this.state = shallowClone(this.prevState);
                }

                let stateParent: any = this.state;
                let prevStateParent: any = this.prevState;
                let last = path.length - 1;

                for (let i = 0, l = last; i < l; i++) {
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
                    this.options.events.emit('rerender-one', this.id);
                }
            }
        } else if (value && typeof value === 'object'){
            const keys = Object.keys(value);

            for (let i = 0, l = keys.length; i < l; i++) {
                this.setState(value[keys[i]], [keys[i]]);
            }
        }
    }

    forceRender(): void {
        this.options.events.emit('force-render', this.id);
    }

    dispatch(event: string, payload?: any) {
        return this.options.dispatch.call(null, event, payload);
    }

    trigger(eventName: string, payload?: any): void {
        if (this._componentMounted) {
            const event = new VEvent(eventName, payload);
            let parent = this.getParent();
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
        return this.options.getParent(this.id);
    }

    render() {
        return;
    }
}
