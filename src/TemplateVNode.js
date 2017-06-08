import { TEMPLATE, TEMPLATE_VNODE, TEMPLATE_FRAGMENT } from './types';
import { debug } from './debug';
import { escapeHtml, escapeAttr, escapeStyle, calcHash } from './utils';
import { specialAttrs } from './constants';
import VNode from './VNode';
import VText from './VText';
import DynamicVNode from './DynamicVNode';

// TODO: full list
var interactiveTags = {
    input: true,
    textarea: true,
    select: true
};

function TemplateVNode(tag, attrs, children) {
    if (attrs) {
        if (attrs.key) {
            this.key = attrs.key;
        }

        if (attrs.uniqid) {
            this.uniqid = attrs.uniqid;
        }

        if (typeof attrs.ref === 'function') {
            this.ref = attrs.ref;
        }
    }

    this.tag = tag;
    this.attrs = attrs || null;
    this.children = children;
}

TemplateVNode.prototype = {
    type: TEMPLATE,
    subtype: TEMPLATE_VNODE,

    calcHash(config) {
        var hash = config.hash;

        hash = calcHash(hash, '<', this.tag);

        if (config.fullHash && this.attrs) {
            for (var name in this.attrs) {
                if (typeof this.attrs[name] !== 'function') {
                    hash = calcHash(hash, name, this.attrs[name]);
                }
            }
        }

        hash = calcHash(hash, '>');

        config.hash = hash;
    },

    renderServer(config) {
        var tag = this.tag;
        var attrs = '';

        if (config.hashEnabled) {
            this.calcHash(config);
        }

        if (this.attrs) {
            for (var name in this.attrs) {
                attrs += stringifyAttr(name, this.attrs[name]);
            }
        }

        config.stream.emit('data', '<' + tag + attrs + '>');

        if (this.children) {
            for (var i = 0, l = this.children.length; i < l; i++) {
                stringifyChildrenItem(this.children[i], config);
            }
        }

        config.stream.emit('data', '</' + tag + '>');
    },

    needDynamic() {
        return this.ref || interactiveTags[this.tag];
    },

    render(config, context) {
        if (config.hashEnabled) {
            this.calcHash(config);
        }

        var nextNode = new VNode(this.tag, this.attrs, context);
        var id = context.getId();

        if (this.needDynamic()) {
            var dynamic;
            if (config.dynamicNodes[id]) {
                dynamic = config.dynamicNodes[id];
                dynamic._replaceNode(nextNode);
            } else {
                dynamic = new DynamicVNode(nextNode);
            }
            config.nextDynamicNodes[id] = dynamic;
            nextNode.setDynamic(dynamic);
        }

        config.nextNodes[id] = nextNode;

        nextNode.setChilds(renderChildren(
            this.children,
            config,
            context.addDomLevel(nextNode, context.getId()),
            false
        ));

        return nextNode;
    }
};

function renderChildren(items, config, context, needKeys) {
    var childs;

    if (items) {
        childs = [];

        for (var i = 0, l = items.length; i < l; i++) {
            var item = items[i];
            var isObject = typeof item === 'object' && item !== null;

            if (isObject && item.type === TEMPLATE) {
                if (needKeys && item.key === undefined) {
                    debug.warn('Each child in array should have key');
                }
                childs.push(item.render(
                    config,
                    context[
                        item.subtype === TEMPLATE_VNODE
                            ? 'incrementDom'
                            : 'incrementComponent'
                    ](needKeys ? item.key || '$' + i : item.key, item.uniqid)
                ));
            } else if (Array.isArray(item)) {
                childs.push.apply(childs, renderChildren(item, config, context.addIdLevel(), true));
            } else if (isObject && item.type === TEMPLATE_FRAGMENT) {
                childs.push.apply(childs, renderChildren(item.fragment, config, context.addIdLevel(), false));
            } else {
                if (config.hashEnabled && item) {
                    config.hash = calcHash(config.hash, String(item));
                }
                var nextContext = context.incrementDom(needKeys ? '$' + i : undefined);
                var nextTextNode = new VText(item ? String(item) : '', nextContext);
                childs.push(nextTextNode);
                config.nextNodes[nextContext.getId()] = nextTextNode;
            }
        }
    }

    return childs || null;
}

function stringifyChildrenItem(item, config) {
    var type = typeof item;

    if (item) {
        if (type === 'object') {
            if (item.type === TEMPLATE) {
                item.renderServer(config);
            } else if (item.type === TEMPLATE_FRAGMENT) {
                for (var j = 0, l1 = item.fragment.length; j < l1; j++) {
                    stringifyChildrenItem(item.fragment[j], config);
                }
            } else if (Array.isArray(item)) {
                for (var j = 0, l1 = item.length; j < l1; j++) {
                    stringifyChildrenItem(item[j], config);
                }
            } else if (item) {
                if (config.hashEnabled) {
                    config.hash = calcHash(config.hash, String(item));
                }
                config.stream.emit('data', escapeHtml(item));
            }
        } else {
            // TODO: null
            if (config.hashEnabled) {
                config.hash = calcHash(config.hash, String(item));
            }
            config.stream.emit('data', escapeHtml(item));
        }
    }
}

function stringifyAttr(name, value) {
    if (name.substr(0, 2) === 'on' || specialAttrs[name]) {
        return '';
    } else if (name === 'dataset') {
        var datasetKeys = Object.keys(value);
        var attrs = '';

        for (var j = 0, n = datasetKeys.length; j < n; j++) {
            attrs += ` data-${datasetKeys[j]}="${escapeAttr(value[datasetKeys[j]])}"`;
        }

        return attrs;
    } else if (name === 'style') {
        return ` style="${escapeStyle(value)}"`;
    } else {
        // TODO: validate name
        return ' ' + convertAttrName(name) + (value ===  true
            ? ''
            : `="${escapeAttr(value)}"`);
    }
}

function convertAttrName(name) {
    return name === 'className' ? 'class' : name;
}

export default TemplateVNode;
export { stringifyAttr };
