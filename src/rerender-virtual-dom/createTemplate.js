import TemplateVNode from './client/TemplateVNode';
import TemplateComponent from './client/TemplateComponent';
import TemplateFragment from './client/TemplateFragment';
import TemplateComponentStateless from './client/TemplateComponentStateless';
import Component from './Component';

export default function createTemplate(componentType, props) {
    const length = arguments.length;
    let children = null;

    if (length > 2 && (arguments[2] || length !== 3)) {
        children = Array(length - 2);

        for (let i = 2; i < length; i++) {
            children[i - 2] = arguments[i];
        }
    }

    if (typeof componentType === 'string') {
        return new TemplateVNode(componentType, props, children);
    } else if (componentType.prototype instanceof Component) {
        return new TemplateComponent(componentType, props, children && new TemplateFragment(children));
    } else {
        return new TemplateComponentStateless(componentType, props, children && new TemplateFragment(children));
    }
}
