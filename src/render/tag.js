import { escapeAttr } from '../utils.js';
import VNode from 'virtual-dom/vnode/vnode';

function tag(config) {
    if (config.stringify) {
        return tagStringify(config);
    } else {
        return tagDom(config);
    }
}

function tagDom() {
    return function (tag, attrs, children, position) {
        return new VNode(tag, attrs, children, position);
    };
}

function tagStringify() {
    return function (tag, attrs, children) {
        let attrsString = '';

        for (let i = 0, attrsKeys = Object.keys(attrs), l = attrsKeys.length; i < l; i++) {
            const key = attrsKeys[i];

            // TODO key === 'key'?
            if (key.substr(0, 2) === 'on' || key === 'ref') {
                continue;
            } else if (key === 'dataset') {
                // TODO dataset
                // TODO style?
            } else {
                const value = attrs[key];

                attrsString += ' ' + convertAttrName(key) + (value ===  true
                    ? ''
                    : `="${escapeAttr(value)}"`);
            }
        }

        const childrenString = children.join('');

        return '<' + tag + attrsString +
            (childrenString !== ''
                ? '>' + childrenString + '</' + tag + '>'
                : ' />');
    };
}

function convertAttrName(name) {
    return name === 'className' ? 'class' : name;
}

export default tag;
