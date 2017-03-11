import { escapeHtml } from '../utils';
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

function textDom({ nextNodes, patch }) {
    return function (value, position) {
        const prevSibling = nextNodes[position.id];

        if (prevSibling.type === 'Text') {
            patch.splitText(position.getPosition(), prevSibling.value.length);
        }

        position.incrementPosition();
        const nextNode = new Text(value, position.getPosition());
        nextNodes[position.id] = nextNode;

        return nextNode;
    };
}

function textDiff({ nodes, nextNodes, patch }) {
    return function (value, position) {
        position.incrementPosition();
        let nextNode = nodes[position.id];
        const nextPosition = position.getPosition();

        if (!nextNode) {
            nextNode = new Text(value, nextPosition);
        } else if (nextNode.value !== value) {
            nextNode = new Text(value, nextPosition);
            patch.replace(nextPosition, nextNode);
        }

        nextNodes[position.id] = nextNode;

        return nextNode;
    };
}

function textStringify(value) {
    return escapeHtml(value);
}

export default text;
export { Text };
