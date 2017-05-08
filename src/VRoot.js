import { VROOT } from './types';

function VRoot() {
    this.parent = null;
    this.parentNode = null;
    this.childNodes = [];
}

VRoot.prototype = {
    type: VROOT,

    setChilds(childs) {
        this.childs = childs;
    },

    appendChild(childNode) {
        this.childNodes.push(childNode);
    }
};

export default VRoot;
