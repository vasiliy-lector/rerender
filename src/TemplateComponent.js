import { TEMPLATE, TEMPLATE_COMPONENT, TEMPLATE_VNODE, VCOMPONENT } from './types';
import VComponent from './VComponent';
import { shallowEqualProps } from './utils';
import VText from './VText';
import Component from './Component';
import reuseTemplate from './reuseTemplate';

const SPECIAL_PROPS = {
    key: true,
    uniqid: true,
    ref: true
};

function TemplateComponent(componentType, props, children) {
    let nextProps = props || {};

    if (nextProps.key !== undefined || componentType.defaults || nextProps.uniqid || (nextProps.ref && !componentType.wrapper)) {
        nextProps = Object.keys(nextProps).reduce((memo, key) => {
            if (SPECIAL_PROPS[key] && (key !== 'ref' || !componentType.wrapper)) {
                this[key] = nextProps[key];
            } else {
                memo[key] = nextProps[key];
            }

            return memo;
        }, {});

        if (componentType.defaults) {
            for (let name in componentType.defaults) {
                if (nextProps[name] === undefined) {
                    nextProps[name] = componentType.defaults[name];
                }
            }
        }
    }

    this.componentType = componentType;
    this.props = nextProps;
    this.children = children;
}

TemplateComponent.prototype = {
    type: TEMPLATE,
    subtype: TEMPLATE_COMPONENT,

    renderToString(config) {
        const componentType = this.componentType;
        const instance = new componentType(this.props, this.children, { store: config.store, antibind: componentType.antibind });
        const template = Component.render(instance);

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
            events
        } = config;
        const id = context.getId();
        let prev = components[id];

        if (prev === undefined || prev.type !== VCOMPONENT || prev.componentType !== componentType) {
            const instance = new componentType(props, children, { store, events, antibind: componentType.antibind });
            if (this.ref && typeof this.ref === 'function') {
                this.ref(instance);
            }
            Component.beforeRender(instance);
            template = Component.render(instance);

            component = new VComponent(
                componentType,
                props,
                children,
                id,
                template,
                instance,
                instance.state
            );

            nextComponents[id] = component;
            mountComponents[id] = component.instance;
        } else {
            component = prev;
            const instance = component.instance;

            Component.beforeRender(instance);

            const sameProps = shallowEqualProps(component.props, props);
            // FIXME
            const sameChildren = false; // children.isEqual(component.children);
            const sameState = instance.state !== component.state;

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

            if (!sameState) {
                component.set('state', instance.state);
            }

            if (sameProps && sameChildren && sameState) {
                template = component.template;
            } else {
                if (!sameProps || !sameChildren) {
                    Component.setProps(instance, props, children);
                }
                template = reuseTemplate(Component.render(instance), prev.template);
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
