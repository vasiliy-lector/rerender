import TemplateVNode from './server/TemplateVNode';
import TemplateComponent from './server/TemplateComponent';

export default function createTemplateServer(componentType, props, ...children) {
    return typeof componentType === 'string'
        ? new TemplateVNode(componentType, props, children)
        : new TemplateComponent(componentType, props, children);
}
