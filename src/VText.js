import { VTEXT } from './types';

function VText(value, context) {
    this.value = value;
    this.context = context;
    context.getParentNode().appendChild(this);
}

VText.prototype = {
    type: VTEXT,

    getNode() {
        return this._node || (this._node = this.context.getNode());
    }
};

export default VText;
