import { TEMPLATE, TEMPLATE_COMPONENT_STATELESS, TEMPLATE_VNODE, VCOMPONENT_STATELESS } from './types';
import VComponentStateless from './VComponentStateless';
import { shallowEqualProps } from './utils';
import VText from './VText';
import reuseTemplate from './reuseTemplate';

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
        const id = context.getId();
        let prev = components[id];

        if (prev === undefined || prev.type !== VCOMPONENT_STATELESS || prev.componentType !== componentType) {
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
            // FIXME
            const sameChildren = false; // children.isEqual(component.children);

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
                template = reuseTemplate(componentType(props, children), prev.template);
                component.set('template', template);
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
