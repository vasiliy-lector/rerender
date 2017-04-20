import { TEMPLATE, TEMPLATE_COMPONENT } from '../types';

function TemplateComponent(instance, props, children) {
    this.instance = instance;
    this.props = props;
    this.children = children;
}

TemplateComponent.prototype = {
    type: TEMPLATE,
    subtype: TEMPLATE_COMPONENT,

    render() {}
};

export default TemplateComponent;
