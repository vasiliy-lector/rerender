import { TEMPLATE, TEMPLATE_COMPONENT, TEMPLATE_VNODE, VCOMPONENT } from './types';
import VComponent from './VComponent';
import { shallowEqualProps } from './utils';
import VText from './VText';
import { componentInit, componentRender, componentBeforeRender, componentSetProps } from './componentLifeCycle';
import reuseTemplate from './reuseTemplate';
import { Connect } from './connect';
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

    renderToString(config) {
        const componentType = this.componentType;
        const options = {
            dispatch: config.dispatcher.dispatch
        };

        if (componentType instanceof Connect) {
            options.storeState = config.store.getState();
        }

        const instance = new componentType(this.props, this.children, options);
        this.preprocessInstance(instance);
        componentInit(instance);
        const template = componentRender(instance);

        return template ? template.renderToString(config) : '';
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
            dispatcher,
            events
        } = config;
        const id = context.getId();
        let prev = components[id];
        const isConnect = componentType instanceof Connect;

        if (prev === undefined || prev.type !== VCOMPONENT || prev.componentType !== componentType) {
            const options = {
                events,
                id,
                dispatch: dispatcher.dispatch
            };
            const storeState = store.getState();

            if (isConnect) {
                options.storeState = storeState;
            }

            const instance = new componentType(props, children, options);
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
                instance.state
            );

            if (isConnect) {
                component.set('storeState', storeState);
            }

            nextComponents[id] = component;
            mountComponents[id] = component.instance;
        } else {
            component = prev;
            component.set('componentTemplate', this);
            component.set('context', context);
            const instance = component.instance;
            const storeState = store.getState();

            componentBeforeRender(instance);

            const sameProps = shallowEqualProps(component.props, props);
            // FIXME
            const sameChildren = false; // children.isEqual(component.children);
            const sameState = instance.state !== component.state;
            const sameStoreState = !isConnect || component.storeState === storeState;

            if (sameProps) {
                props = component.props;
            } else {
                component.set('props', props);
            }

            if (sameChildren) {
                children = component.children;
            } else {
                component.set('children', children);
            }

            if (sameProps && sameChildren && sameState && sameStoreState) {
                template = component.template;
            } else {
                if (!sameProps || !sameChildren || !sameStoreState) {
                    let additional;

                    if (isConnect) {
                        additional = storeState;
                    }

                    componentSetProps(instance, props, children, additional);
                }
                component.set('state', instance.state);
                if (isConnect) {
                    component.set('storeState', storeState);
                }
                template = reuseTemplate(componentRender(instance), prev.template);
                component.set('template', template);
                updateComponents[id] = component.instance;
            }

            nextComponents[id] = component;
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
