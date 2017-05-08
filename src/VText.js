import { VTEXT } from './types';

function VText(value, context) {
    this.value = value;
    this.context = context;
}

VText.prototype = {
    type: VTEXT
};

export default VText;
