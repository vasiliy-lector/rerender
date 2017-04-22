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
    this.props = props;
    this.children = children;
}

TemplateComponent.prototype = {
    type: TEMPLATE,
    subtype: TEMPLATE_COMPONENT_STATELESS,

    render(config, context) {
        let props = this.props;
        let children = this.children;
        let template;
        const componentType = this.componentType;
        const { virtualDomById, nextVirtualDomById } = config;
        const componentContext = context.incrementComponent(this.key, this.uniqid);
        const id = componentContext.getId();
        let prev = virtualDomById[id];

        if (prev === undefined || prev.type !== this.type || prev.componentType !== componentType) {
            template = componentType(props, children);

            nextVirtualDomById[id] = new VComponentStateless(
                id,
                componentType,
                props,
                children,
                template
            );
        } else {
            const sameProps = shallowEqualProps(prev.props, props);
            const sameChildren = typeof children === 'object' && children.type === TEMPLATE && children.isEqual(prev.children);

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

            if (sameProps && sameChildren) {
                template = prev.template;
            } else {
                template = componentType(props, children);
                // TODO: reuse prev template here
                prev.set('template', template);
            }

            nextVirtualDomById[id] = prev;
        }

        return typeof template === 'object' ? template.render(config, componentContext) : new VText('');
    }
};

export default TemplateComponent;
