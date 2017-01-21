import { escapeHtml } from '../utils';
import VText from '../dom/VText';

function text(config) {
    if (config.stringify) {
        return textStringify;
    } else {
        return textDom;
    }
}

function textStringify(value) {
    return escapeHtml(value);
}

function textDom(value) {
    return new VText(value);
}

export default text;
