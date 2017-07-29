import { TEMPLATE, TEMPLATE_COMPONENT, TEMPLATE_VNODE, VCOMPONENT } from './types';
import { stringifyChildrenItem } from './TemplateVNode';
import VComponent from './VComponent';
import { mayAsync } from './utils';
import VText from './VText';
import { componentInit, componentBeforeRender, componentSetProps } from './componentLifeCycle';
import reuseTemplate from './reuseTemplate';
import { specialAttrs, specialAttrsWrapper } from './constants';
import { memoizeLast } from './utils';

function TemplateComponent(componentType, props, children, targetComponentType) {
    let nextProps = props || {};

    if (componentType.wrapper) {
        nextProps = Object.keys(nextProps).reduce((memo, key) => {
            if (specialAttrsWrapper[key]) {
                this[key] = nextProps[key];
            } else {
                memo[key] = nextProps[key];
            }

            return memo;
        }, {});
    } else {
        nextProps = Object.keys(nextProps).reduce((memo, key) => {
            if (specialAttrs[key]) {
                this[key] = nextProps[key];
            } else {
                memo[key] = nextProps[key];
            }

            return memo;
        }, {});
    }

    if (componentType.defaults) {
        for (let name in componentType.defaults) {
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

    this.componentType = componentType;
    this.props = nextProps;
    this.children = children;
}

TemplateComponent.prototype = {
    type: TEMPLATE,
    subtype: TEMPLATE_COMPONENT,

    firstRenderInit(instance, config) {
        if (typeof instance.init === 'undefined') {
            return;
        }

        const { dispatcher } = config;

        dispatcher.beginCatch();
        componentInit(instance);

        if (dispatcher.isCatched()) {
            return dispatcher.waitCatched().then(() => {
                if (this.componentType.store) {
                    componentSetProps(instance, this.props, this.children, config.store.getState());
                }
            }, error => config.stream.emit('error', error));
        // FIXME: for what setProps inside else?
        } else if (this.componentType.store) {
            componentSetProps(instance, this.props, this.children, config.store.getState());
        }
    },

    renderServer(config) {
        const componentType = this.componentType;
        const instance = new componentType(
            this.props,
            this.children,
            config.componentOptions,
            undefined,
            componentType.store ? config.store.getState() : undefined
        );

        return mayAsync(
            this.firstRenderInit(instance, config),
            () => stringifyChildrenItem(instance.render(), config),
            error => config.stream.emit('error', error)
        );
    },

    render(config, context) {
        let props = this.props;
        let children = this.children;
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
        let prev = components[id];
        const needStore = componentType.store;

        if (prev === undefined || prev.type !== VCOMPONENT || prev.componentType !== componentType) {
            const storeState = needStore ? store.getStateSnapshot() : undefined;
            const instance = new componentType(
                props,
                children,
                componentOptions,
                id,
                storeState
            );
            const componentWillReceiveProps = memoizeLast(
                (props, children, additional) => componentSetProps(instance, props, children, additional),
                [ true, false, false ],
                [ props, children, storeState ]
            );
            const render = memoizeLast(
                () => instance.render(),
                [ true, false, false ]
            );

            componentInit(instance);

            if (needStore && typeof instance.init === 'function' && typeof componentWillReceiveProps === 'function') {
                componentWillReceiveProps(props, children, store.getStateSnapshot());
            }

            if (this.ref && typeof this.ref === 'function') {
                this.ref(instance);
            }
            if (this.wrapperRef && typeof this.wrapperRef === 'function') {
                this.wrapperRef(instance);
            }

            componentBeforeRender(instance);

            template = render(props, children, instance.getStateSnapshot());

            component = new VComponent({
                render,
                componentWillReceiveProps,
                componentType,
                id,
                componentTemplate: this,
                context,
                ref: instance
            });

            nextComponents[id] = component;
            mountComponents[id] = component.ref;
        } else {
            const instance = prev.ref;
            componentBeforeRender(instance);
            prev.componentWillReceiveProps(props, children, needStore && store.getStateSnapshot());
            template = prev.render(props, children, instance.getStateSnapshot());

            component = new VComponent({
                componentType,
                render: prev.render,
                componentWillReceiveProps: prev.componentWillReceiveProps,
                id,
                componentTemplate: this,
                context,
                ref: instance
            });

            nextComponents[id] = component;
            updateComponents[id] = component.ref;
        }

        // FIXME: createText and move increment inside render
        let childs;

        if (template) {
            childs = template.render(
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

        component.set('childs', [childs]);

        return component;
    }
};

export default TemplateComponent;
