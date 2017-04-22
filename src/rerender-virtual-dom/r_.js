import TemplateVNode from './client/TemplateVNode';
import TemplateComponent from './client/TemplateComponent';
import TemplateFragment from './client/TemplateFragment';
import TemplateComponentStateless from './client/TemplateComponentStateless';
import Component from './Component';

function createTemplateClient(componentType, props, ...children) {
    props = { ...props };

    if (typeof componentType === 'string') {
        return new TemplateVNode(componentType, props, children);
    } else if (componentType instanceof Component) {
        return new TemplateComponent(componentType, props, new TemplateFragment(children));
    } else {
        return new TemplateComponentStateless(componentType, props, new TemplateFragment(children));
    }
}

function createTemplateServer(componentType, props, ...children) {
    props = { ...props };

    return typeof componentType === 'string'
        ? new TemplateVNode(componentType, props, children)
        : new TemplateComponent(componentType, props, children);
}

const isServer = typeof window === undefined;
const r_ = isServer ? createTemplateServer : createTemplateClient;

export default r_;
