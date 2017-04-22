import TemplateVNode from './client/TemplateVNode';
import TemplateComponent from './client/TemplateComponent';
import TemplateComponentStateless from './client/TemplateComponentStateless';
import Component from './Component';

export default function createTemplateClient(instance, props, ...children) {
    if (typeof instance === 'string') {
        return new TemplateVNode(instance, props, children);
    } else if (instance instanceof Component) {
        return new TemplateComponent(instance, props, children);
    } else {
        return new TemplateComponentStateless(instance, props, children);
    }
}
