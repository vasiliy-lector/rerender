import { shallowEqual } from '../utils';
import Attrs from './Attrs';
import Props, { PropsWrapper } from './Props';

function CacheByValues(values, tag, props) {
    this.values = values;
    this.tag = tag;
    this.props = props;
}

CacheByValues.prototype = {
    type: 'CacheByValues'
};

function execComponent({ cacheByValues, nextCacheByValues, method }, jsx) {
    return function(result, values, position) {
        const prevNode = cacheByValues[position.id];
        let tag, props, isTag, componentId;

        if (prevNode && shallowEqual(prevNode.values, values)) {
            values = prevNode.values;
            componentId = prevNode.componentId;
            tag = prevNode.tag;
            props = prevNode.props;
            isTag = typeof tag === 'string';
            nextCacheByValues[position.id] = prevNode;
        } else {
            const tag = typeof result[1] === 'function' ? result[1](values) : result[1];
            isTag = typeof tag === 'string';

            if (isTag) {
                props = result[2](new Attrs(), values);
            } else {
                props = result[2](tag.wrapper ? new PropsWrapper() : new Props(), values);
                componentId = calcComponentPosition(tag, props.special, position.id);
                const prevNode = cacheByValues[componentId];
                if (prevNode && shallowEqual(prevNode.values, values)) {
                    values = prevNode.values;
                    props = prevNode.props;
                } else {
                    if (tag.defaults && typeof tag.defaults === 'object') {
                        const defaultsKeys = Object.keys(tag.defaults);

                        for (let i = 0, l = defaultsKeys.length; i < l; i++) {
                            if (props.common[defaultsKeys[i]] === undefined) {
                                props.common[defaultsKeys[i]] = tag.defaults[defaultsKeys[i]];
                            }
                        }
                    }
                }
                nextCacheByValues[position.id] = new CacheByValues(values, tag, props);
            }
        }

        if (isTag) {
            position.incrementPosition();

            return jsx.tag(
                tag,
                props,
                parentNode => result[4](values, position.addPositionLevel(parentNode), jsx),
                position
            );
        } else {
            position = position.updateId(componentId);
            nextCacheByValues[componentId] = prevNode;
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

export default execComponent;
