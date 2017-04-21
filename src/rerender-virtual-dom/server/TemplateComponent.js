import { TEMPLATE, TEMPLATE_COMPONENT } from '../types';
import Component from '../Component';

function TemplateComponent(instance, props, children) {
    this.instance = instance;
    this.props = props;
    this.children = children;
}

TemplateComponent.prototype = {
    type: TEMPLATE,
    subtype: TEMPLATE_COMPONENT,

    render(config) {
        const tag = this.instance;
        let componentTemplate;
        let props = this.props;

        if (tag.defaults) {
            for (let name in tag.defaults) {
                if (!props || props[name] === undefined) {
                    (props || (props = {}))[name] = tag.defaults[name];
                }
            }
        }

        if (tag.prototype instanceof Component) {
            const instance = new tag(props, this.children, { store: config.store, antibind: tag.antibind });

            componentTemplate = Component.render(instance);
        } else {
            componentTemplate = tag(props, this.children);
        }

        return componentTemplate ? componentTemplate.render(config) : '';
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
