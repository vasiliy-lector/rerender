import TemplateVNode from './client/TemplateVNode';
import TemplateComponent from './client/TemplateComponent';
import TemplateFragment from './client/TemplateFragment';
import TemplateComponentStateless from './client/TemplateComponentStateless';
import Component from './Component';

export default function createTemplateClient(componentType, props, ...children) {
    if (typeof componentType === 'string') {
        return new TemplateVNode(componentType, props, children);
    } else if (componentType instanceof Component) {
        return new TemplateComponent(componentType, props, new TemplateFragment(children));
    } else {
        return new TemplateComponentStateless(componentType, props, new TemplateFragment(children));
    }
}