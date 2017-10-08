import { shallowClone } from './utils/shallowClone';
import { Events } from './Events';
import { VEvent } from './VEvent';
import { debug } from './debug';
import { VComponent } from './VComponent';

type Path = Array<string | number>;

export abstract class Component<Props, State> extends Events {
    public settingProps: boolean = false; // FIXME: private
    public componentMounted: boolean = false; // FIXME: private

    public abstract init: () => void;
    public abstract componentWillMount: () => void;
    public abstract componentWillUnmount: () => void;
    public abstract componentDidMount: () => void;
    public abstract componentDidUpdate: () => void;
    public abstract componentWillReceiveProps: (props: Props, additional: any) => void;
    public abstract componentWillDestroy: () => void;

    protected state: Partial<State> = {};
    private prevState: Partial<State>;

    constructor(/* FIXME: protected*/public props: Props, private readonly options: any, private readonly id: string) {
        super();
    }

    public getStateSnapshot(path?: Path): any {
        if (this.prevState) {
            delete this.prevState;
        }

        return this.getState(path);
    }

    public getState(path?: Path): any {
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

    public forceRender(): void {
        this.options.events.emit('force-render', this.id);
    }

    public dispatch(event: string, payload?: any) {
        return this.options.dispatch.call(null, event, payload);
    }

    public trigger(eventName: string, payload?: any): void {
        if (this.componentMounted) {
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

    public getParent() {
        return this.options.getParent(this.id);
    }

    public render() {
        return;
    }

    protected setState(value: any, path?: Path): void {
        if (path && Array.isArray(path)) {
            if (this.getState(path) !== value) {
                if (!this.prevState) {
                    this.prevState = this.state;
                    this.state = shallowClone(this.prevState);
                }

                let stateParent: any = this.state;
                let prevStateParent: any = this.prevState;
                const last = path.length - 1;

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

                if (this.componentMounted && !this.settingProps) {
                    this.options.events.emit('rerender-one', this.id);
                }
            }
        } else if (value && typeof value === 'object') {
            const keys = Object.keys(value);

            for (let i = 0, l = keys.length; i < l; i++) {
                this.setState(value[keys[i]], [keys[i]]);
            }
        }
    }
}