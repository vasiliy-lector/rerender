import TemplateVNode from './server/TemplateVNode';
import TemplateComponent from './server/TemplateComponent';

export default function createTemplateServer(instance, props, ...children) {
    return typeof instance === 'string'
        ? new TemplateVNode(instance, props, children)
        : new TemplateComponent(instance, props, children);
}
