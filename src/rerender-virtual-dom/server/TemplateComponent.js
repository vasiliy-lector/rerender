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
        const props = {};

        if (this.props) {
            for (let i = 0, l = this.props.length; i < l; i = i + 2) {
                const name = this.props[i];
                const value = this.props[i + 1];
                if (name === '...' && typeof value === 'object') {
                    for (let key in value) {
                        setProp(props, key, value[key]);
                    }
                } else {
                    setProp(props, name, value);
                }
            }
        }

        if (tag.defaults) {
            for (let name in tag.defaults) {
                if (props[name] === undefined) {
                    props[name] = tag.defaults[name];
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
