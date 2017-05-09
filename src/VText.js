import { VTEXT } from './types';

function VText(value, context) {
    this.value = value;
    this.context = context;
    context.getParentNode().appendChild(this);
}

VText.prototype = {
    type: VTEXT,

    getDomNode() {
        return this._node || (this._node = this.context.getDomNode());
    }
};

export default VText;
