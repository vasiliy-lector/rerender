import { TemplateVNode } from './TemplateVNode';
import { Context } from './Context';
import { TemplateComponent } from './TemplateComponent';
import { TemplateFragment } from './TemplateFragment';
import { TemplateComponentStateless } from './TemplateComponentStateless';
import { Component } from './Component';
import { Promise } from './Promise';

interface StatelessComponentStatics<Props = Map<any>> {
    defaults?: Partial<Props>;
}

type StatelessFunction<Props> = (props: Props) => Renderable;

export type StatelessComponent<Props extends Map<any> = Map<any>> =
    StatelessFunction<Props> & StatelessComponentStatics<Props>;

export interface ComponentType<C extends Component<Props, State>, Props = any, State = any> {
    wrapper?: boolean;
    store?: boolean;
    defaults?: Map<any>;
    new(...args: any[]): C;
}
export type ElementType = string | ComponentType<any> | StatelessComponent;

export type Template = TemplateVNode | TemplateComponent | TemplateComponentStateless;

type RenderableItem = number | string | boolean | undefined | null | Template;
export type TemplateChildren = RenderableItem[] | null;
export type Renderable = RenderableItem | RenderableItem[];

export type ConfigServer = any; // FIXME
export type ConfigClient = any; // FIXME

export type VirtualDom = any; // FIXME
export type VirtualDomNode = any; // FIXME

export type AttrsValue = any;
export type Attrs = Map<AttrsValue>;

export interface TemplateBase {
    renderServer: (config: ConfigServer) => Promise<void> | void;
    renderClient: (config: ConfigClient, context: Context) => VirtualDom;
}

export type Controller = any; // FIXME

export type Path = Array<string | number>;

type SetStateDirect<State> = (value: State) => void;
type SetStatePath<State> = (value: any, path: Path) => void;
export type SetState<State = any> = SetStateDirect<State> | SetStatePath<State>;

type GetStateDirect<State> = () => State;
type GetStatePath<State> = (path: Path) => any;
export type GetState<State = any> = GetStateDirect<State> | GetStatePath<State>;

export type ActionMethods<State = any, Payload = any, Result = any> = {
    getState: GetState<State>,
    dispatch: Dispatch<Payload, Result>
};

export type ReducerMethods<State = any> = {
    getState: GetState<State>,
    setState: SetState<State>
};
export type Action<State = any, Payload = any, Result = any> =
    (methods: ActionMethods<State, Payload, Result>, payload: Payload) => Result;
export type Reducer<State = any, Payload = any> = (methods: ReducerMethods<State>, payload: Payload) => void;

export type Event = {
    name: string,
    cache?: boolean,
    serverEnabled?: boolean,
    userIndependent?: boolean,
    action?: Action,
    serverCacheAge: number,
    reducers?: Reducer[]
};

export type DispatcherCacheItem = {
    event: Event,
    payload: any,
    result: Promise<any>
};

export type DispatcherCache = {
    [eventName: string]: DispatcherCacheItem[]
};

export type DispatcherCacheItemDehydrated = {
    name: string,
    payload: any,
    result: any
};

export type DispatcherCacheDehydrated = {
    [eventName: string]: DispatcherCacheItemDehydrated[]
};

export type Dispatch<Payload = any, Result = any> = (event: Event, payload: Payload) => Promise<Result>;

export type EventDefaults = {
    cache?: boolean,
    userIndependent?: boolean,
    serverEnabled?: boolean,
    serverCacheAge?: number
};

export type RawProps = Map<any> | null | void;

export interface Map<T> {
    [key: string]: T;
}

export type HeaderOptions = {
    title: string,
    head: string,
    applicationId: string
};

export type FooterOptions = {
    bodyEnd: string
};

export type ApplicationOptions = {
    dispatcherCache: DispatcherCache,
    applicationId?: string,
    hashEnabled?: boolean,
    eventDefaults?: EventDefaults,
    hash?: boolean,
    fullHash?: boolean
};
