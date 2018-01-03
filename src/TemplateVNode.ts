import { TEMPLATE, TEMPLATE_VNODE, TEMPLATE_FRAGMENT } from './constants';
import { debug } from './debug';
import { escapeHtml, escapeAttr, escapeStyle, calcHash, mayAsync } from './utils';
import { noRenderAttrs } from './constants';
import { isPromise } from './Promise';
import { VNode } from './VNode';
import { VText } from './VText';
import { DynamicVNode } from './DynamicVNode';

// TODO: full list
const interactiveTags: any = {
    input: true,
    textarea: true,
    select: true
};

export class TemplateVNode {
    public type = TEMPLATE;
    public subtype = TEMPLATE_VNODE;

    private key: string;
    private uniqid: string;
    private ref: any;

    constructor(public tag: string, public attrs: any, public children: any) {
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

    public renderServer(config: any) {
        const tag = this.tag;
        let attrs = '';

        if (config.hashEnabled) {
            this.calcHash(config);
        }

        if (this.attrs) {
            for (const name in this.attrs) {
                attrs += stringifyAttr(name, this.attrs[name]);
            }
        }

        config.stream.emit('data', '<' + tag + attrs + '>');

        return mayAsync(this.children && stringifyChildren(this.children, config), () => {
            config.stream.emit('data', '</' + tag + '>');
        }, error => config.stream.emit('error', error));
    }

    public renderClient(config: any, context: any) {
        if (config.hashEnabled) {
            this.calcHash(config);
        }

        const nextNode = new VNode(this.tag, this.attrs, context);
        const id = context.getId();

        if (this.needDynamic()) {
            let dynamic;
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

    private calcHash(config: any) {
        let hash = config.hash;

        hash = calcHash(hash, '<', this.tag);

        if (config.fullHash && this.attrs) {
            for (const name in this.attrs) {
                if (typeof this.attrs[name] !== 'function') {
                    hash = calcHash(hash, name, String(this.attrs[name]));
                }
            }
        }

        hash = calcHash(hash, '>');

        config.hash = hash;
    }

    private needDynamic() {
        return this.ref || interactiveTags[this.tag];
    }
}

function renderChildrenFirst(items: any[], config: any, context: any, needKeys?: boolean) {
    return renderChildren(items, config, context, needKeys, true);
}

function renderChildren(items: any[], config: any, context: any, needKeys?: boolean, serverLike?: boolean): any {
    let childs;

    if (items) {
        childs = [];

        for (let i = 0, l = items.length; i < l; i++) {
            const item = items[i];
            const isObject = typeof item === 'object' && item !== null;

            if (isObject && item.type === TEMPLATE) {
                if (needKeys && item.key === undefined) {
                    debug.warn('Each child in array should have key');
                }
                childs.push(item[serverLike ? 'renderClientServerLike' : 'renderClient'](
                    config,
                    context[
                        item.subtype === TEMPLATE_VNODE
                            ? 'incrementDom'
                            : 'incrementComponent'
                    ](needKeys ? item.key || '$' + i : item.key, item.uniqid)
                ));
            } else if (Array.isArray(item)) {
                childs.push.apply(childs, renderChildren(item, config, context.addIdLevel(), true, serverLike));
            } else if (isObject && item.type === TEMPLATE_FRAGMENT) {
                childs.push.apply(
                    childs,
                    renderChildren(item.fragment, config, context.addIdLevel(), false, serverLike)
                );
            } else {
                if (config.hashEnabled && item) {
                    config.hash = calcHash(config.hash, String(item));
                }
                const nextContext = context.incrementDom(needKeys ? '$' + i : undefined);
                const nextTextNode = new VText(item ? String(item) : '', nextContext);
                childs.push(nextTextNode);
                config.nextNodes[nextContext.getId()] = nextTextNode;
            }
        }
    }

    return childs || null;
}

function stringifyChildren(children: any, config: any, begin: number = 0, l: number = children.length): any {
    for (let i = begin; i < l; i++) {
        const result = stringifyChildrenItem(children[i], config);

        if (isPromise(result)) {
            return result.then(() => {
                return stringifyChildren(children, config, i + 1, l);
            }, error => {
                config.stream('error', error);
            });
        }
    }
}

const enabledPrimitives: any = {
    string: true,
    number: true
};

function stringifyChildrenItem(item: any, config: any) {
    const type = typeof item;

    if (enabledPrimitives[type]) {
        if (config.hashEnabled) {
            config.hash = calcHash(config.hash, String(item));
        }
        config.stream.emit('data', escapeHtml(item));
    } else if (type === 'object' && item !== null) {
        if (item.type === TEMPLATE) {
            return item.renderServer(config);
        } else if (item.type === TEMPLATE_FRAGMENT) {
            return stringifyChildren(item.fragment, config);
        } else if (Array.isArray(item)) {
            return stringifyChildren(item, config);
        } else if (item) {
            if (config.hashEnabled) {
                config.hash = calcHash(config.hash, String(item));
            }
            config.stream.emit('data', escapeHtml(item));
        }
    }
}

function stringifyAttr(name: string, value: any) {
    if (name === 'style') {
        return ` style="${escapeStyle(value)}"`;
    } else if (name === 'attributes') {
        let result = '';

        for (const n in value) {
            result += ` ${name}="${escapeAttr(value[n])}"`;
        }

        return result;
    } else if (noRenderAttrs[name] || name.substr(0, 2) === 'on') {
        return '';
    } else {
        // TODO: validate name
        return ' ' + convertAttrName(name) + (value ===  true
            ? ''
            : `="${escapeAttr(value)}"`);
    }
}

type ConvertAttr = {
    [key: string]: string
};
const convertAttr: ConvertAttr = {
    className: 'class',
    maxLength: 'maxlength'
};

function convertAttrName(name: string) {
    return convertAttr[name] || name;
}

export { stringifyAttr, stringifyChildrenItem };
