import { shallowClone } from './utils';
import { Events } from './Events';
import { VEvent } from './VEvent';
import { debug } from './debug';
import { VComponent } from './VComponent';
import { Event, IntrinsicProps, Map, Renderable, TemplateChildren } from './types';

type Path = Array<string | number>;

export abstract class Component<
    Props extends Map<any>,
    State = void,
    Defaults extends Partial<Props> = {}
> extends Events {
    public settingProps: boolean = false;
    public componentMounted: boolean = false;

    protected state: State;
    private prevState?: State;

    constructor(
        public props: Props & Defaults & { children?: TemplateChildren },
        private readonly options?: any,
        private readonly id?: string
    ) {
        super();
    }

    public init?(): any;
    public componentWillMount?(): any;
    public componentWillUnmount?(): any;
    public componentDidMount?(): any;
    public componentDidUpdate?(): any;
    public componentWillReceiveProps?(props: Props, additional?: any): any;
    public componentWillDestroy?(): any;
    public abstract render(): Renderable;

    public forceRender(): void {
        this.options.events.emit('force-render', this.id);
    }

    public dispatch(event: Event, payload?: any) {
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

    public dehydrate(): State {
        return this.state;
    }

    public rehydrate(state: State, props: Props, storeState?: any) {
        return this.setState(state);
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
