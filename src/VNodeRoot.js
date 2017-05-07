import { VNODE_ROOT } from './types';

function VNodeRoot() {
    this.parentNode = null;
    this.childNodes = [];
}

VNodeRoot.prototype = {
    type: VNODE_ROOT,

    appendChild(childNode) {
        this.childNodes.push(childNode);
    }
};

export default VNodeRoot;
