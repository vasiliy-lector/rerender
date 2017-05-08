import { VROOT } from './types';

function VRoot() {
    this.parentNode = null;
    this.childNodes = [];
}

VRoot.prototype = {
    type: VROOT,

    appendChild(childNode) {
        this.childNodes.push(childNode);
    }
};

export default VRoot;
