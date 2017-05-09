import { VNODE } from './types';

function VNode(tag, attrs, context) {
    this.tag = tag;
    this.attrs = attrs;
    this.parent = context.getParent();
    this.parentNode = context.getParentNode();
    this.childNodes = [];
    this.context = context;
    context.getParentNode().appendChild(this);
}

VNode.prototype = {
    type: VNODE,

    setChilds(childs) {
        this.childs = childs;
    },

    appendChild(childNode) {
        this.childNodes.push(childNode);
    },

    getNode() {
        return this._node || (this._node = this.context.getNode());
    }
};

export default VNode;
