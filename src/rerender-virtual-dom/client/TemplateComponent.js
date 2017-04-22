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
    this.props = props;
    this.children = children;
}

TemplateComponent.prototype = {
    type: TEMPLATE,
    subtype: TEMPLATE_COMPONENT,

    render(config, context) {
        let props = this.props;
        let children = this.children;
        let template;
        const componentType = this.componentType;
        const { virtualDomById, nextVirtualDomById, store, events } = config;
        const componentContext = context.incrementComponent(this.key, this.uniqid);
        const id = componentContext.getId();
        let prev = virtualDomById[id];

        if (prev === undefined || prev.type !== this.type || prev.componentType !== componentType) {
            const instance = new componentType(props, children, { store, events, antibind: componentType.antibind });
            if (this.ref && typeof this.ref === 'function') {
                this.ref(instance);
            }
            Component.beforeRender(instance);
            template = Component.render(instance);

            nextVirtualDomById[id] = new VComponent(
                id,
                componentType,
                props,
                children,
                instance.state,
                instance,
                template
            );
        } else {
            const instance = prev.instance;

            Component.beforeRender(instance);

            const sameProps = shallowEqualProps(prev.props, props);
            const sameChildren = typeof children === 'object' && children.type === TEMPLATE && children.isEqual(prev.children);
            const sameState = instance.state !== prev.state;

            if (sameProps) {
                props = prev.props;
            } else {
                prev.set('props', props);
            }

            if (sameChildren) {
                children = prev.children;
            } else {
                prev.set('children', children);
            }

            if (!sameState) {
                prev.set('state', instance.state);
            }

            if (sameProps && sameChildren && sameState) {
                template = prev.template;
            } else {
                if (!sameProps || !sameChildren) {
                    Component.setProps(instance, props, children);
                }
                template = Component.render(instance);
                // TODO: reuse prev template here
                prev.set('template', template);
            }

            nextVirtualDomById[id] = prev;
        }

        return typeof template === 'object' ? template.render(config, componentContext) : new VText('');
    }
};

export default TemplateComponent;
