import { TEMPLATE, TEMPLATE_COMPONENT, TEMPLATE_VNODE, VCOMPONENT } from './types';
import VComponent from './VComponent';
import { shallowEqualProps, mayAsync } from './utils';
import VText from './VText';
import { componentInit, componentRender, componentBeforeRender, componentSetProps } from './componentLifeCycle';
import reuseTemplate from './reuseTemplate';
import { specialAttrs, specialAttrsWrapper } from './constants';

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

    preprocessInstance(instance) {
        const antibind = this.componentType.antibind;

        if (antibind && Array.isArray(antibind)) {
            for (let i = 0, l = antibind.length; i < l; i++) {
                let name = antibind[i];

                if (typeof instance[name] === 'function') {
                    instance[name] = instance[name].bind(instance);
                }
            }
        }
    },

    renderServer(config) {
        const componentType = this.componentType;
        const instance = new componentType(this.props, this.children, config.componentOptions, undefined, config.store.getState());
        this.preprocessInstance(instance);

        return mayAsync(componentInit(instance), () => {
            const template = componentRender(instance);

            if (template) {
                return template.renderServer(config);
            }
        });
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
            let storeState;
            if (needStore) {
                storeState = store.getState(undefined, true);
            }
            const instance = new componentType(
                props,
                children,
                componentOptions,
                id,
                needStore ? storeState : undefined
            );
            this.preprocessInstance(instance);
            componentInit(instance);
            if (this.ref && typeof this.ref === 'function') {
                this.ref(instance);
            }
            if (this.wrapperRef && typeof this.wrapperRef === 'function') {
                this.wrapperRef(instance);
            }
            componentBeforeRender(instance);
            template = componentRender(instance);

            component = new VComponent(
                componentType,
                props,
                children,
                id,
                template,
                this,
                context,
                instance,
                instance.getState(undefined, true)
            );

            if (needStore) {
                component.set('storeState', storeState);
            }

            nextComponents[id] = component;
            mountComponents[id] = component.ref;
        } else {
            const instance = prev.ref;
            const storeState = store.getState(undefined, true);

            componentBeforeRender(instance);

            const sameProps = shallowEqualProps(prev.props, props);
            // FIXME
            const sameChildren = false; // children.isEqual(prev.children);
            const sameState = instance.getState(undefined, true) !== prev.state;
            const sameStoreState = !needStore || prev.storeState === storeState;

            if (sameProps) {
                props = prev.props;
            }

            if (sameChildren) {
                children = prev.children;
            }

            if (sameProps && sameChildren && sameState && sameStoreState) {
                template = prev.template;
            } else {
                if (!sameProps || !sameChildren || !sameStoreState) {
                    let additional;

                    if (needStore) {
                        additional = storeState;
                    }

                    componentSetProps(instance, props, children, additional);
                }
                template = reuseTemplate(componentRender(instance), prev.template);
            }

            component = new VComponent(
                componentType,
                props,
                children,
                id,
                template,
                this,
                context,
                instance,
                instance.getState(undefined, true)
            );

            if (needStore) {
                component.set('storeState', storeState);
            }

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
