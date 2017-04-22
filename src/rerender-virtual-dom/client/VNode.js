import { VNODE } from '../types';

function VNode(tag, attrs, parentNode, parentDomNode) {
    this.tag = tag;
    this.attrs = attrs;
    this.parentNode = parentNode;
    this.parentDomNode = parentDomNode;
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
