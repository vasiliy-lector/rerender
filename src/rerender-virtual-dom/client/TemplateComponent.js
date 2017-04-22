import { TEMPLATE, TEMPLATE_COMPONENT } from '../types';
import VComponent from './VComponent';
import { shallowEqualProps } from '../../utils';
import VText from './VText';
import Component from '../Component';

function TemplateComponent(componentType, props, children) {
    if (componentType.defaults) {
        if (!props) {
            props = { ...componentType.defaults };
        } else {
            for (let name in componentType.defaults) {
                if (props[name] === undefined) {
                    props[name] = componentType.defaults[name];
                }
            }
        }
    }

    if (props.uniqid) {
        this.uniqid = props.uniqid;
        delete props.uniqid;
    }

    if (props.key) {
        this.key = props.key;
        delete props.key;
    }

    if (props.ref && !componentType.wrapper) {
        this.ref = props.ref;
        delete props.ref;
    }

    this.componentType = componentType;
    this.props = props || {};
    this.children = children;
}

TemplateComponent.prototype = {
    type: TEMPLATE,
    subtype: TEMPLATE_COMPONENT,

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
        const componentContext = context.incrementComponent(this.key, this.uniqid);
        const id = componentContext.getId();
        let prev = components[id];

        if (prev === undefined || prev.type !== this.type || prev.componentType !== componentType) {
            const instance = new componentType(props, children, { store, events, antibind: componentType.antibind });
            if (this.ref && typeof this.ref === 'function') {
                this.ref(instance);
            }
            Component.beforeRender(instance);
            template = Component.render(instance);

            const component = new VComponent(
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
            const sameChildren = children.isEqual(component.children);
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
                template = Component.render(instance);
                // TODO: reuse prev template here
                component.set('template', template);
                updateComponents[id] = component.instance;
            }

            nextComponents[id] = component;
        }

        const childs = template ? template.render(config, componentContext) : new VText('');

        component.set('childs', childs);

        return component;
    }
};

export default TemplateComponent;
