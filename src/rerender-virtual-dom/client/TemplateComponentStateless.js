import { TEMPLATE, TEMPLATE_COMPONENT_STATELESS } from '../types';
import VComponentStateless from './VComponentStateless';
import { shallowEqualProps } from '../../utils';
import VText from './VText';

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

    if (props.ref) {
        delete props.ref;
    }

    this.componentType = componentType;
    this.props = props || {};
    this.children = children;
}

TemplateComponent.prototype = {
    type: TEMPLATE,
    subtype: TEMPLATE_COMPONENT_STATELESS,

    render(config, context) {
        let props = this.props;
        let children = this.children;
        let template;
        let component;
        const componentType = this.componentType;
        const { components, nextComponents } = config;
        const componentContext = context.incrementComponent(this.key, this.uniqid);
        const id = componentContext.getId();
        let prev = components[id];

        if (prev === undefined || prev.type !== this.type || prev.componentType !== componentType) {
            template = componentType(props, children);
            component = new VComponentStateless(
                componentType,
                props,
                children,
                id,
                template
            );

            nextComponents[id] = component;
        } else {
            component = prev;
            const sameProps = shallowEqualProps(component.props, props);
            const sameChildren = typeof children === 'object' && children.type === TEMPLATE && children.isEqual(component.children);

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

            if (sameProps && sameChildren) {
                template = component.template;
            } else {
                template = componentType(props, children);
                // TODO: reuse prev template here
                component.set('template', template);
            }

            nextComponents[id] = component;
        }

        const childs = template ? template.render(config, componentContext) : new VText('');

        component.set('childs', childs);

        return component;
    }
};

export default TemplateComponent;
