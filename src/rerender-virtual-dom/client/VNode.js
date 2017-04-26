import { VNODE } from '../types';

function VNode(tag, attrs, context) {
    this.tag = tag;
    this.attrs = attrs;
    this.parent = context.getParent();
    this.parentNode = context.getParentNode();
    this.childNodes = [];
}

VNode.prototype = {
    type: VNODE,

    setChilds(childs) {
        this.childs = childs;
    },

    appendChild(childNode) {
        this.childNodes.push(childNode);
    }
};

export default VNode;
