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

    setDynamic(dynamic) {
        this.dynamic = dynamic;
    },

    setChilds(childs) {
        this.childs = childs;
    },

    appendChild(childNode) {
        this.childNodes.push(childNode);
    },

    getDomNode() {
        return this._node || (this._node = this.context.getDomNode());
    }
};

export default VNode;
