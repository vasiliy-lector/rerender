import Template from './client/Template';

export default function createTemplateClient(instance, props, ...children) {
    return new Template(instance, props, children);
}
