import { VROOT } from './types';

function VRoot(domNode) {
    this.parent = null;
    this.parentNode = null;
    this.childNodes = [];
    this.domNode = domNode;
}

VRoot.prototype = {
    type: VROOT,

    setChilds(childs) {
        this.childs = childs;
    },

    appendChild(childNode) {
        this.childNodes.push(childNode);
    },

    getDomNode() {
        return this.domNode;
    }
};

export default VRoot;
