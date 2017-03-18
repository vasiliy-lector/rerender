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
    let prevTextNode;
    let prevParentPosition;
    let prevIndex;

    return function (value, position) {
        position.incrementPosition();
        if (prevIndex === position.getIndex() - 1 && prevParentPosition === position.getParentPosition()) {
            patch.splitText(prevTextNode.position, prevTextNode.value.length);
        }

        const nextNode = new Text(value, position.getPosition());
        nextNodes[position.id] = nextNode;
        prevTextNode = nextNode;
        prevParentPosition = position.getParentPosition();
        prevIndex = position.getIndex();
        return nextNode;
    };
}

function textDiff(config) {
    return function (value, position) {
        const { nodes, nextNodes, patch } = config;
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
