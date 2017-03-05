import { escapeHtml } from '../utils';
import { createText } from './createElement';
import Text from '../virtualDom/Text';

function text(config) {
    if (config.stringify) {
        return textStringify;
    } else if (config.method === 'create') {
        return textDom(config);
    } else {
        return textDiff(config);
    }
}

function textDom({ nextNodes, document, normalizePatch }) {
    return function (value, position) {
        const prevSibling = nextNodes[position.id];

        if (prevSibling.type === 'Text') {
            normalizePatch.splitText(position.getPosition(), prevSibling.value.length);
        }

        position.incrementPosition();
        const node = new Text(value, position);
        nextNodes[position.id] = node;

        return createText(node, document);
    };
}

function textDiff({ nodes, nextNodes, patch }) {
    return function (value, position) {
        position.incrementPosition();
        let node = nodes[position.id];

        if (!node) {
            node = new Text(value, position.getPosition());
            patch.create(position.getParentPosition(), position.getIndex(), node);
        } else if (node.value !== value) {
            node = new Text(value, position.getPosition());
            patch.replace(position.getPosition(), node);
        }

        nextNodes[position.id] = node;
    };
}

function textStringify(value) {
    return escapeHtml(value);
}

export default text;
export { Text };
