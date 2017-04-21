import { VNODE } from '../types';

function VNode(tag, attrs, parentNode, parentDomNode) {
    this.tag = tag;
    this.attrs = attrs;
    this.parentNode = parentNode;
    this.parentDomNode = parentDomNode;
}

VNode.prototype = {
    type: VNODE,

    setChildNodes(childNodes) {
        this.childNodes = childNodes;
    }
};

export default VNode;
