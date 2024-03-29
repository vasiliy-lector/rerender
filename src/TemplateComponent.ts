import { TEMPLATE, TEMPLATE_COMPONENT, TEMPLATE_VNODE, VCOMPONENT } from './constants';
import { Component } from './Component';
import { Context } from './Context';
import { stringifyChildrenItem } from './TemplateVNode';
import { VComponent } from './VComponent';
import { mayAsync } from './utils';
import { VText } from './VText';
import { componentInit, componentBeforeRender, componentSetProps } from './componentLifeCycle';
import { specialAttrs, specialAttrsWrapper } from './constants';
import { memoize } from './utils';

import {
    Map,
    RawProps,
    ElementType,
    TemplateBase,
    Children,
    ConfigServer,
    ConfigClient,
    ComponentType
} from './types';

export class TemplateComponent implements TemplateBase {
    public type: string = TEMPLATE;
    public subtype: string = TEMPLATE_COMPONENT;

    public key: string | number;
    private controller: ComponentType<any>;
    private props: Map<any>;
    private ref?: (ref: Component<any>) => any;
    private wrapperRef?: (ref: Component<any>) => any;

    constructor(
        private componentType: ComponentType<any>,
        props: RawProps,
        children: Children,
        targetComponentType?: ElementType
    ) {
        let nextProps: Map<any> = props || {};

        if (componentType.wrapper) {
            nextProps = Object.keys(nextProps).reduce((memo: Map<any>, key) => {
                if (specialAttrsWrapper[key]) {
                    (this as any)[key] = nextProps[key];
                } else {
                    memo[key] = nextProps[key];
                }

                return memo;
            }, {});
        } else {
            nextProps = Object.keys(nextProps).reduce((memo: Map<any>, key) => {
                if (specialAttrs[key]) {
                    (this as any)[key] = nextProps[key];
                } else {
                    memo[key] = nextProps[key];
                }

                return memo;
            }, {});
        }

        nextProps.children = children;

        if (componentType.defaults) {
            for (const name in componentType.defaults) {
                if (nextProps[name] === undefined) {
                    nextProps[name] = componentType.defaults[name];
                }
            }
        }

        if (targetComponentType) {
            nextProps.targetComponentType = targetComponentType;
            if (this.controller) {
                nextProps.targetController = this.controller;
            }
        }

        this.props = nextProps;
    }

    public renderServer(config: ConfigServer) {
        const componentType = this.componentType;
        const instance = new componentType(
            this.props,
            config.componentOptions,
            undefined
            // FIXME: componentType.store ? config.store.getState() : undefined
        );

        return mayAsync(
            this.firstRenderInit(instance, config),
            () => stringifyChildrenItem(instance.render(), config),
            error => config.stream.emit('error', error)
        );
    }

    public renderClient(config: ConfigClient, context: Context) {
        const props = this.props;
        let template;
        let component;
        const componentType = this.componentType;
        const {
            components,
            nextComponents,
            mountComponents,
            updateComponents,
            store,
            componentOptions
        } = config;
        const id = context.getId();
        const prev = components[id];
        const needStore = componentType.store;

        if (prev === undefined || prev.type !== VCOMPONENT || prev.componentType !== componentType) {
            const storeState = needStore ? store.getStateSnapshot() : undefined;
            const instance = new componentType(
                props,
                componentOptions,
                id
                // FIXME: storeState
            );
            const componentWillReceiveProps = memoize(
                (nextProps, additional) => componentSetProps(instance, nextProps, additional),
                [ undefined, undefined ],
                // [ shallowEqualProps, undefined ],
                [ props, storeState ]
            );
            const render = memoize(
                () => instance.render(),
                [ undefined, undefined ]
                // [ shallowEqualProps, undefined ]
            );

            componentInit(instance);

            if (needStore && typeof instance.init === 'function' && typeof componentWillReceiveProps === 'function') {
                componentWillReceiveProps(props, store.getStateSnapshot());
            }

            if (this.ref && typeof this.ref === 'function') {
                this.ref(instance);
            }
            if (this.wrapperRef && typeof this.wrapperRef === 'function') {
                this.wrapperRef(instance);
            }

            componentBeforeRender(instance);

            template = render(props, instance.getStateSnapshot());

            component = new VComponent(
                render,
                componentWillReceiveProps,
                componentType,
                id,
                this,
                context,
                instance
            );

            nextComponents[id] = component;
            mountComponents[id] = component.ref;
        } else {
            const instance = prev.ref;
            componentBeforeRender(instance);
            prev.componentWillReceiveProps(props, needStore && store.getStateSnapshot());
            template = prev.render(props, instance.getStateSnapshot());

            component = new VComponent(
                prev.render,
                prev.componentWillReceiveProps,
                componentType,
                id,
                this,
                context,
                instance
            );

            nextComponents[id] = component;
            updateComponents[id] = component.ref;
        }

        // FIXME: createText and move increment inside render
        let childs;

        if (template) {
            childs = template.renderClient(
                config,
                context.addIdLevel(component)[
                    template.subtype === TEMPLATE_VNODE
                        ? 'incrementDom'
                        : 'incrementComponent'
                ](template.key, template.uniqid)
            );
        } else {
            const nextContext = context.addIdLevel(component).incrementDom();
            const nextTextNode = new VText('', nextContext);
            childs = nextTextNode;
            config.nextNodes[nextContext.getId()] = nextTextNode;
        }

        component.setChilds([childs]);

        return component;
    }

    private firstRenderInit(instance: Component<any, any>, config: ConfigServer): void | Promise<any> {
        if (typeof instance.init === 'undefined') {
            return;
        }

        const { dispatcher } = config;

        dispatcher.beginCatch();
        componentInit(instance);

        if (dispatcher.isCatched()) {
            return dispatcher.waitCatched().then(() => {
                if (this.componentType.store) {
                    componentSetProps(instance, this.props, config.store.getState());
                }
            }, (error: any) => config.stream.emit('error', error));
        }
    }
}
