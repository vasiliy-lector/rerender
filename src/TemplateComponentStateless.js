import { TEMPLATE, TEMPLATE_COMPONENT_STATELESS, TEMPLATE_VNODE, VCOMPONENT_STATELESS } from './types';
import VComponentStateless from './VComponentStateless';
import { shallowEqualProps } from './utils';
import VText from './VText';
import reuseTemplate from './reuseTemplate';

var SPECIAL_PROPS = {
    key: true,
    uniqid: true
};

function TemplateComponentStateless(componentType, props, children) {
    var nextProps = props || {};

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
            for (var name in componentType.defaults) {
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

TemplateComponentStateless.prototype = {
    type: TEMPLATE,
    subtype: TEMPLATE_COMPONENT_STATELESS,

    renderServer(config) {
        var template = this.componentType(this.props, this.children);

        return template ? template.renderServer(config) : '';
    },

    render(config, context) {
        var props = this.props;
        var children = this.children;
        var template;
        var component;
        var componentType = this.componentType;
        var { components, nextComponents } = config;
        var id = context.getId();
        var prev = components[id];

        if (prev === undefined || prev.type !== VCOMPONENT_STATELESS || prev.componentType !== componentType) {
            template = componentType(props, children);
            component = new VComponentStateless(
                componentType,
                props,
                children,
                id,
                template,
                this,
                context
            );

            nextComponents[id] = component;
        } else {
            var sameProps = shallowEqualProps(prev.props, props);
            // FIXME
            var sameChildren = false; // children.isEqual(prev.children);

            if (sameProps) {
                props = prev.props;
            }

            if (sameChildren) {
                children = prev.children;
            }

            if (sameProps && sameChildren) {
                template = prev.template;
            } else {
                template = reuseTemplate(componentType(props, children), prev.template);
            }

            component = new VComponentStateless(
                componentType,
                props,
                children,
                id,
                template,
                this,
                context
            );
            nextComponents[id] = component;
        }

        // FIXME: createText and move increment inside render
        var childs;

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
            var nextContext = context.addIdLevel(component).incrementDom();
            var nextTextNode = new VText('', nextContext);
            childs = nextTextNode;
            config.nextNodes[nextContext.getId()] = nextTextNode;
        }

        component.set('childs', [childs]);

        return component;
    }
};

export default TemplateComponentStateless;
