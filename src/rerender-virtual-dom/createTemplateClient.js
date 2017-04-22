import TemplateVNode from './client/TemplateVNode';
import TemplateComponent from './client/TemplateComponent';
import TemplateFragment from './client/TemplateFragment';
import TemplateComponentStateless from './client/TemplateComponentStateless';
import Component from './Component';

export default function createTemplateClient(instance, props, ...children) {
    if (typeof instance === 'string') {
        return new TemplateVNode(instance, props, children);
    } else if (instance instanceof Component) {
        return new TemplateComponent(instance, props, new TemplateFragment(children));
    } else {
        return new TemplateComponentStateless(instance, props, new TemplateFragment(children));
    }
}
