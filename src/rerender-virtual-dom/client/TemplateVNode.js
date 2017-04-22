import { TEMPLATE, TEMPLATE_VNODE } from '../types';
import VNode from './VNode';
import VText from './VText';

function TemplateVNode(tag, attrs, children) {
    if (attrs.ref) {
        this.ref = attrs.ref;
        delete attrs.ref;
    }

    if (attrs.key) {
        this.key = attrs.key;
        delete attrs.key;
    }

    if (attrs.uniqid) {
        this.uniqid = attrs.uniqid;
        delete attrs.uniqid;
    }

    this.tag = tag;
    this.attrs = attrs;
    this.children = children;
}

TemplateVNode.prototype = {
    type: TEMPLATE,
    subtype: TEMPLATE_VNODE,

    renderChildNodes() {},

    render(config, context) {
        const nextNode = new VNode(this.tag, this.attrs);

        const childs = this.renderChildNodes(config, context);
        nextNode.setChilds(childs);

        return nextNode;
    }
};

export default TemplateVNode;
