import { TEMPLATE, TEMPLATE_COMPONENT_STATELESS } from './types';
import VComponentStateless from './VComponentStateless';
import { shallowEqualProps } from './utils';
import VText from './VText';

const SPECIAL_PROPS = {
    key: true,
    uniqid: true
};

function TemplateComponent(componentType, props, children) {
    let nextProps = props || {};

    if (nextProps.key || componentType.defaults || nextProps.uniqid) {
        nextProps = Object.keys(nextProps).reduce((memo, key) => {
            if (SPECIAL_PROPS[key]) {
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
    subtype: TEMPLATE_COMPONENT_STATELESS,

    renderToString(config) {
        const template = this.componentType(this.props, this.children);

        return template ? template.renderToString(config) : '';
    },

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

        const childs = template
            ? template.render(config, componentContext.addIdLevel(component))
            : new VText('', componentContext.addIdLevel(component).incrementDom());

        component.set('childs', childs);

        return component;
    }
};

export default TemplateComponent;
