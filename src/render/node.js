import { shallowEqual } from '../utils';

function Node(tag, props, values) {
    this.tag = tag;
    this.props = props;
    this.values = values;
}

function node({ nextNodes, nodes }, jsx) {
    return function(result, values, position) {
        const isTag = typeof tag === 'string';
        if (!isTag) {
            position = position.updateAbsolute(calcComponentPosition(tag, props, position.id));
        }
        const prevNode = nodes[position.id];
        let tag, props;

        if (prevNode && shallowEqual(prevNode.values, values)) {
            values = prevNode.values;
            tag = prevNode.tag;
            props = prevNode.props;
            nextNodes[position.id] = prevNode;
        } else {
            tag = typeof result[1] === 'function' ? result[1](values) : result[1];
            props = result[2](values);

            if (!isTag && tag.defaults && typeof tag.defaults === 'object') {
                const defaultsKeys = Object.keys(tag.defaults);

                for (let i = 0, l = defaultsKeys.length; i < l; i++) {
                    if (props[defaultsKeys[i]] === undefined) {
                        props[defaultsKeys[i]] = tag.defaults[defaultsKeys[i]];
                    }
                }
            }

            nextNodes[position.id] = new Node(tag, props, values);
        }

        if (isTag) {
            return jsx.tag(
                tag,
                props,
                result[4](values, position.addInstantLevel(), jsx),
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

function calcComponentPosition(tag, props, position) {
    // TODO warning if many instances of singleton or with same key
    if (tag.uniqid) {
        return `u${tag.uniqid}`;
    } else if (props.uniqid) {
        return `u${props.uniqid}`;
    } else if (props.key) {
        return `position.k${props.key}`;
    } else {
        return `${position}.c`;
    }
}

export default node;
