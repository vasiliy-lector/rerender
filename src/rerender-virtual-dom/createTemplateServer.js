import Template from './server/Template';

export default function createTemplateServer(tag, attrs, ...children) {
    return new Template(tag, attrs, children);
}
