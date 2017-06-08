import TemplateVNode from './TemplateVNode';
import TemplateComponent from './TemplateComponent';
import TemplateFragment from './TemplateFragment';
import TemplateComponentStateless from './TemplateComponentStateless';
import Component from './Component';
import Controllers from './Controllers';

export default function createTemplate(componentType, props) {
    const length = arguments.length;
    let children = null;

    if (length > 2 && (arguments[2] || length !== 3)) {
        children = Array(length - 2);

        for (let i = 2; i < length; i++) {
            children[i - 2] = arguments[i];
        }
    }

    if (props && props.controller) {
        return createTemplateController(componentType, props, children);
    } if (typeof componentType === 'string') {
        return new TemplateVNode(componentType, props, children);
    } else if (componentType.controller !== undefined) {
        return createTemplateController(componentType, props, children);
    } else if (componentType.prototype instanceof Component) {
        return new TemplateComponent(componentType, props, children && new TemplateFragment(children));
    } else {
        return new TemplateComponentStateless(componentType, props, children && new TemplateFragment(children));
    }
}

function createTemplateController(componentType, props, children) {
    // FIXME: TemplateFragment?
    return new TemplateComponent(Controllers, nextProps, children && new TemplateFragment(children), componentType);
}
