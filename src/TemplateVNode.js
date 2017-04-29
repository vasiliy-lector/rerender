import { TEMPLATE, TEMPLATE_VNODE, TEMPLATE_FRAGMENT } from './types';
import { escapeHtml, escapeAttr, escapeStyle } from './utils';
import { voidTags } from './constants';
import VNode from './VNode';
import VText from './VText';

const specialProps = {
    key: true,
    uniqid: true,
    ref: true
};

function TemplateVNode(tag, attrs, children) {
    if (attrs) {
        if (attrs.ref) {
            this.ref = attrs.ref;
        }

        if (attrs.key) {
            this.key = attrs.key;
        }

        if (attrs.uniqid) {
            this.uniqid = attrs.uniqid;
        }
    }

    this.tag = tag;
    this.attrs = attrs || null;
    this.children = children;
}

TemplateVNode.prototype = {
    type: TEMPLATE,
    subtype: TEMPLATE_VNODE,

    renderToString(config) {
        const tag = this.tag;
        let children = '';
        let attrs = '';

        if (this.attrs) {
            for (let name in this.attrs) {
                attrs += stringifyAttr(name, this.attrs[name]);
            }
        }

        if (this.children) {
            for (let i = 0, l = this.children.length; i < l; i++) {
                children += stringifyChildrenItem(this.children[i], config);
            }
        }

        return '<' + tag + attrs +
            (children === '' && voidTags[tag]
                ? ' />'
                : '>' + children + '</' + tag + '>');
    },

    render(config, context) {
        const nodeContext = context.incrementDom(this.key, this.uniqid);
        const nextNode = new VNode(this.tag, this.attrs, nodeContext);

        nextNode.setChilds(renderChildren(this.children, config, nodeContext.addDomLevel(nextNode), false));

        return nextNode;
    }
};

function renderChildren(children, config, context, needKeys) {
    let childs;

    if (children) {
        childs = [];

        for (let i = 0, l = children.length; i < l; i++) {
            const item = children[i];
            const isObject = typeof item === 'object';

            if (isObject && item.type === TEMPLATE) {
                childs.push(item.render(config, context));
            } else if (Array.isArray(item)) {
                childs.push.apply(childs, renderChildren(item, config, context.addIdLevel(), true));
            } else if (isObject && item.type === TEMPLATE_FRAGMENT) {
                childs.push.apply(childs, renderChildren(item.fragment, config, context.addIdLevel(), false));
            } else {
                childs.push(new VText(item ? String(item) : '', context.incrementDom()));
            }
        }
    }

    return childs || null;
}

function stringifyChildrenItem(item, config) {
    const type = typeof item;
    let children = '';

    if (type === 'object') {
        if (item.type === TEMPLATE) {
            children += item.renderToString(config);
        } else if (item.type === TEMPLATE_FRAGMENT) {
            for (let j = 0, l1 = item.fragment.length; j < l1; j++) {
                children += stringifyChildrenItem(item.fragment[j], config);
            }
        } else if (Array.isArray(item)) {
            for (let j = 0, l1 = item.length; j < l1; j++) {
                children += stringifyChildrenItem(item[j], config);
            }
        } else if (item) {
            escapeHtml(item);
        }
    } else if (item) {
        children += escapeHtml(item);
    }

    return children;
}

function stringifyAttr(name, value) {
    if (name.substr(0, 2) === 'on' || specialProps[name]) {
        return '';
    } else if (name === 'dataset') {
        const datasetKeys = Object.keys(value);
        let attrs = '';

        for (let j = 0, n = datasetKeys.length; j < n; j++) {
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
