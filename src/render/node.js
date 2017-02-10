import { shallowEqual } from '../utils';

function node({ nextCachedNodes, cachedNodes }, jsx) {
    return function(result, values, position) {
        const prevNode = cachedNodes[position];
        let tag, props;

        if (prevNode && shallowEqual(prevNode.values, values)) {
            values = prevNode.values;
            tag = prevNode.tag;
            props = prevNode.props;
            nextCachedNodes[position] = prevNode;
        } else {
            tag = typeof result[1] === 'function' ? result[1](values) : result[1];
            props = result[2](values);
            nextCachedNodes[position] = { values, tag, props };
        }

        if (typeof tag === 'string') {
            return jsx.tag(
                tag,
                props,
                result[4](values, position, jsx),
                position
            );
        } else {
            return jsx.component(
                tag,
                props,
                jsx.template(result[4], values),
                position
            );
        }
    };
}

export default node;
