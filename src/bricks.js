import { escapeAttr, escapeHtml, getFunctionName } from './utils.js';
import Component from './Component';
import VNode from 'virtual-dom/vnode/vnode';
import VText from 'virtual-dom/vnode/vtext';

function Template(template) {
    this.template = template;
}

Template.prototype = {
    exec(position) {
        return this.template(position);
    },
    type: 'Template'
};

// function VText(value) {
//     this.value = value;
// }
//
// VText.prototype = {
//     type: 'VText'
// };
//
// function VNode(tag, attrs, children) {
//     this.tag = tag;
//     this.attrs = attrs;
//     this.children = children;
// }
//
// VNode.prototype = {
//     type: 'VNode'
// };

function template(template) {
    return new Template(template);
}

function component(config, jsx) {
    if (config.stringify) {
        return componentStringify(config, jsx);
    } else {
        return componentDom(config, jsx);
    }
}

function componentDom({ allInstances }, jsx) {
    return function(tag, attrs, children, position) {
        const current = allInstances[position];

        // FIXME find faster way to determine Component
        if (tag.prototype instanceof Component) {
            const instance = new tag(attrs, children, { position, jsx });
            return instance.render(instance);
        } else {
            return jsx.tag(tag, attrs, children, position);
        }
    };
}

function componentStringify(config, jsx) {
    return function(tag, attrs, children, position) {
        position = calcComponentPosition(tag, attrs, position);

        if (tag.prototype instanceof Component) {
            const instance = new tag(attrs, children, { position, jsx });
            Component.beforeRender(instance);

            return instance.render(instance);
        } else {
            return jsx.tag(tag, attrs, children, position);
        }
    };
}

function calcComponentPosition(tag, attrs, position) {
    // TODO warning if many instances of singleton or with same key
    if (tag.singleton) {
        return `__s__${getFunctionName(tag)}`;
    } else if (attrs.key) {
        return `__k__${attrs.key}`;
    } else {
        return `${position}${getFunctionName(tag)}`;
    }
}

function tag(config) {
    if (config.stringify) {
        return tagStringify(config);
    } else {
        return tagDom(config);
    }
}

function tagDom() {
    return function (tag, attrs, children, position) {
        return new VNode(tag, attrs, typeof children === 'function'
            ? children(position)
            : children);
    };
}

function tagStringify() {
    return function (tag, attrs, children, position) {
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

        const childrenString = (typeof children === 'function' ? children(position) : children).join('');

        return '<' + tag + attrsString +
            (childrenString !== ''
                ? '>' + childrenString + '</' + tag + '>'
                : ' />');
    };
}

function text(config) {
    if (config.stringify) {
        return textStringify;
    } else {
        return textDom;
    }
}

function textStringify(value) {
    return escapeHtml(value);
}

function textDom(value) {
    return new VText(value);
}

function childValue(config, jsx) {
    return function(value, position) {
        if (Array.isArray(value)) {
            for (var i = 0, l = value.length, expanded = []; i < l; i++) {
                expanded.push(childValue(value[i], `${position}.${i}`));
            }

            return config.stringify ? expanded.join('') : expanded;
        } else if (typeof value === 'string') {
            return jsx.text(value);
        } else if (typeof value === 'function') {
            return value.type === 'Template'
                ? value.exec(position)
                : childValue(value(), position);
        } else {
            return jsx.text(!value ? '' : value + '');
        }
    };
}

function convertAttrName(name) {
    return name === 'className' ? 'class' : name;
}

export { component, childValue, text, template, tag };
