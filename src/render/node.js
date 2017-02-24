import { shallowEqual } from '../utils';
import Attrs from './Attrs';
import Props, { PropsWrapper } from './Props';

function node({ nodes, nextNodes, instances, nextInstances }, jsx) {
    return function(result, values, position) {
        const tag = typeof result[1] === 'function' ? result[1](values) : result[1];

        if (typeof tag === 'string') {
            position.incrementPosition();
            const prevNode = nodes[position.id];
            let props;

            if (prevNode && shallowEqual(prevNode.values, values)) {
                values = prevNode.values;
                props = prevNode.props;
            } else {
                props = result[2](new Attrs(), values);
            }

            const output = jsx.tag(
                tag,
                props,
                result[4](values, position.addPositionLevel(), jsx),
                position
            );
            nextNodes[position.id].values = values;

            return output;
        } else {
            // FIXME: how do not call function always?
            let props = result[2](tag.wrapper ? new PropsWrapper() : new Props(), values);
            position = position.updateId(calcComponentPosition(tag, props.special, position.id));
            const prevNode = instances[position.id];

            if (prevNode && shallowEqual(prevNode.values, values)) {
                values = prevNode.values;
                props = prevNode.props;
            } else if (tag.defaults && typeof tag.defaults === 'object') {
                const defaultsKeys = Object.keys(tag.defaults);

                for (let i = 0, l = defaultsKeys.length; i < l; i++) {
                    if (props.common[defaultsKeys[i]] === undefined) {
                        props.common[defaultsKeys[i]] = tag.defaults[defaultsKeys[i]];
                    }
                }
            }

            const output = jsx.component(
                tag,
                props,
                jsx.template(result[4], values),
                position
            );
            nextInstances[position.id].values = values;

            return output;
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
