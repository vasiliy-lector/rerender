import { TEMPLATE, TEMPLATE_COMPONENT } from '../types';
import Component from '../Component';

function TemplateComponent(componentType, props, children) {
    this.componentType = componentType;

    if (componentType.defaults) {
        if (!props) {
            props = componentType.defaults;
        } else {
            for (let name in componentType.defaults) {
                if (props[name] === undefined) {
                    props[name] = componentType.defaults[name];
                }
            }
        }
    }

    this.props = props || {};
    this.children = children;
}

TemplateComponent.prototype = {
    type: TEMPLATE,
    subtype: TEMPLATE_COMPONENT,

    render(config) {
        const componentType = this.componentType;
        let template;
        let props = this.props;

        if (componentType.prototype instanceof Component) {
            const instance = new componentType(props, this.children, { store: config.store, antibind: componentType.antibind });

            template = Component.render(instance);
        } else {
            template = componentType(props, this.children);
        }

        return template ? template.render(config) : '';
    }
};

const SPECIAL_MEANING_ATTRS = {
    ref: true,
    key: true,
    uniqid: true
};

function setProp(props, name, value) {
    if (!SPECIAL_MEANING_ATTRS[name]) {
        props[name] = value;
    }
}

export default TemplateComponent;
