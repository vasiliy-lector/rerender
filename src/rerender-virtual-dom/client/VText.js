import { VText } from '../types';

function Text(value) {
    this.value = value || '';
}

Text.prototype = {
    type: VText
};

export default Text;
