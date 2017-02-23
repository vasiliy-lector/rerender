import { escapeHtml } from '../utils';

function Text(value, position) {
    this.value = value;
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
        nextNodes[position.id] = new Text(value, position);

        return document.createTextNode(value);
    };
}

function textDiff({ nodes, nextNodes, patch }) {
    return function (value, position) {
        position.incrementPosition();
        let node = nodes[position.id];

        if (!node || node.value !== value) {
            node = new Text(value, position);
            patch.push(patch.replace(position.getPosition(), node));
        }

        nextNodes[position.id] = node;
    };
}

function textStringify(value) {
    return escapeHtml(value);
}

export default text;
