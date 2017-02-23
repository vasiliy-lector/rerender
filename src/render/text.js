import { escapeHtml } from '../utils';

function Text(text, position) {
    this.text = text;
    this.position = position;
}

Text.prototype = {
    type: 'Text'
};

function text(config) {
    if (config.stringify) {
        return textStringify;
    } else if (config.method === 'create') {
        return textDom(config);
    } else {
        return textDiff(config);
    }
}

function textDom({ nextNodes, document }) {
    return function (value, position) {
        position.incrementPosition();
        nextNodes[position.id] = new Text(value, position.getPosition());

        return document.createTextNode(value);
    };
}

function textDiff({ nextNodes, document }) {
    return function (value, position) {
        position.incrementPosition();
        nextNodes[position.id] = new Text(value, position.getPosition());

        return document.createTextNode(value);
    };
}

function textStringify(value) {
    return escapeHtml(value);
}

export default text;
