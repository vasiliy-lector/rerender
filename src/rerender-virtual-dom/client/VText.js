import { VTEXT } from '../types';

function VText(value) {
    this.value = value;
}

VText.prototype = {
    type: VTEXT
};

export default VText;
