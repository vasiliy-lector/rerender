import { TemplateVNode } from './TemplateVNode';
import { Store } from './Store';
import { DispatcherFirstRender } from './DispatcherFirstRender';
import { Dispatcher } from './Dispatcher';
import { Events } from './Events';
import { VNode } from './VNode';
import { VText } from './VText';
import { DynamicVNode } from './DynamicVNode';
import { Context } from './Context';
import { TemplateComponent } from './TemplateComponent';
import { TemplateFragment } from './TemplateFragment';
import { TemplateComponentStateless } from './TemplateComponentStateless';
import { Component } from './Component';
import { VComponent } from './VComponent';
import { Promise } from './Promise';

export interface StatelessComponent<Props, Defaults extends Partial<Props> = {}> {
    (props: Props & Defaults & { children?: Children }): Renderable;
    displayName?: string;
    defaults?: Defaults;
}

export interface ComponentType<C extends Component<any>> {
    wrapper?: boolean;
    displayName?: string;
    store?: boolean;
    defaults?: Map<any>;
    new(...args: any[]): C;
}

export type ElementType = string | ComponentType<any> | StatelessComponent<any, any>;

// export type Template = TemplateComponent | TemplateComponentStateless<any, any>;
export type Template = TemplateVNode | TemplateComponent | TemplateComponentStateless<any, any>;

export type Renderable =
    number |
    string |
    boolean |
    void |
    undefined |
    null |
    Template |
    TemplateFragment |
    RenderableArray;
export interface RenderableArray extends Array<Renderable> {}
export type Children = null | TemplateFragment | Renderable[];

export type ConfigServer<State = any> = {
    store: Store<State>,
    dispatcher: DispatcherFirstRender,
    hashEnabled?: boolean,
    fullHash?: boolean,
    stream: Events,
    hash: number,
    componentOptions: {
        dispatch: Dispatch
    }
};
export type ConfigClient<State = any> = {
    store: Store<State>,
    dispatcher: DispatcherFirstRender | Dispatcher,
    events: Events,
    rootTempalate: Template,
    document?: HTMLDocument,
    rootNode?: HTMLElement,
    components: Map<VirtualDom>,
    nextComponents: Map<VirtualDom>,
    mountComponents: Map<VirtualDom>,
    updateComponents: Map<VirtualDom>,
    nodes: Map<VirtualDomNode>,
    nextNodes: Map<VirtualDomNode>,
    dynamicNodes: Map<DynamicVNode>,
    hashEnabled?: boolean,
    fullHash?: boolean,
    hash?: number,
    componentOptions: {
        dispatch: Dispatch,
        getParent: any,
        events: Events
    },
    virtualRoot: any,
    firstRender: boolean
};

export type VirtualDom = any; // FIXME
export type VirtualDomNode = any; // FIXME

export type AttrsValue = any;
export type Attrs = Map<AttrsValue>;

export interface TemplateBase {
    renderServer: (config: ConfigServer<any>) => Promise<void> | void;
    renderClient: (config: ConfigClient<any>, context: Context) => VirtualDom;
}

export type Path = Array<string | number>;

export type SetStateDirect<State> = (value: State) => void;
export type SetStatePath<State> = (value: any, path: Path) => void;
export type SetState<State = any> = SetStateDirect<State> | SetStatePath<State>;

export type GetStateDirect<State> = () => State;
export type GetStatePath<State> = (path: Path) => any;
export type GetState<State = any> = GetStateDirect<State> | GetStatePath<State>;

export type EffectMethods<State = any, Payload = any, Result = any> = {
    getState: GetState<State>,
    dispatch: Dispatch<Payload, Result>
};

export type ReducerMethods<State = any> = {
    getState: GetState<State>,
    setState: SetState<State>
};
export type Effect<State = any, Payload = any, Result = any> =
    (methods: EffectMethods<State, Payload, Result>, payload: Payload) => Result;
export type Reducer<State = any, Payload = any> = (methods: ReducerMethods<State>, payload: Payload) => void;

export type Event = {
    name: string,
    take?: 'every' | 'latest',
    cache?: boolean,
    verify?: boolean,
    effect?: Effect,
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

export type EventSettings = {
    cache?: boolean,
    userIndependent?: boolean,
    serverEnabled?: boolean,
    serverCacheAge?: number
};

export type RawProps = Map<any> | null | void;
export type IntrinsicProps = {
    controller?: ComponentType<any>;
    uniqid?: string | number;
    key?: string | number;
    ref?: (ref: VirtualDomNode) => any;
    wrapperRef?: (ref: ComponentType<any>) => any;
};

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
    eventDefaults?: EventSettings,
    hash?: boolean,
    fullHash?: boolean
};

export type Controller = (Wrapped: ElementType) => ComponentType<any>;

declare global {
    namespace JSX {
        type Element = Renderable;

        interface IntrinsicAttributes {
            controller?: ComponentType<any>;
            uniqid?: string | number;
            key?: string | number;
            ref?: (ref: VirtualDomNode) => any;
            wrapperRef?: (ref: ComponentType<any>) => any;
        }

        interface IntrinsicElements {
            [key: string]: any;
        }

        interface ElementAttributesProperty { externalProps: {}; }
    }
}

/**
 * From https://github.com/Microsoft/TypeScript/issues/12215#issuecomment-307871458
 * The Diff type is a subtraction operator for string literal types. It relies on:
 *  - T | never = T
 *  - T & never = never
 *  - An object with a string index signature can be indexed with any string.
 */
export type StringDiff<T extends string, U extends string> = ({[K in T]: K} &
    {[K in U]: never} & {[K: string]: never})[T];

/**
 * From https://github.com/Microsoft/TypeScript/issues/12215#issuecomment-311923766
 * Omits keys in K from object type T
 */
export type ObjectOmit<T extends object, K extends keyof T> = Pick<T, StringDiff<keyof T, K>>;

/**
 * Returns a version of type T where all properties which are also in U are optionalized.
 * Useful for makding props with defaults optional in React components.
 * Compare to flow's $Diff<> type: https://flow.org/en/docs/types/utilities/#toc-diff
 */
export type Optionalize<T extends object, U extends object> = ObjectOmit<T, keyof U & keyof T> &
    {[K in (keyof U & keyof T)]?: T[K]};
