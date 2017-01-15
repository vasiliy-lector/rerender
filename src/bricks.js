import { escapeAttr, escapeHtml, getFunctionName, shallowEqual } from './utils.js';
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

// FIXME find faster way to determine Component
function isComponent(tag) {
    return tag.prototype instanceof Component;
}

function component(config, jsx) {
    if (config.stringify) {
        return componentStringify(config, jsx);
    } else {
        return componentDom(config, jsx);
    }
}

function componentDom({ allInstances }, jsx) {
    return function(tag, props, children, position) {
        position = calcComponentPosition(tag, props, position);
        let current = allInstances[position];

        if (current === undefined || current.tag !== tag) {
            current = { tag, props, children };

            if (isComponent(tag)) {
                current.instance = new tag(props, children, { position, jsx });
                if (props.ref && !tag.wrapper && typeof props.ref === 'function') {
                    props.ref(current.instance);
                }
                Component.beforeRender(current.instance);
                current.lastRender = Component.render(current.instance).exec(position);
                current.state = current.instance.state;
            } else {
                current.lastRender = tag({ props, children, jsx }).exec(position);
            }

            allInstances[position] = current;
        } else {
            let sameOuter = shallowEqual(current.props, props) && children === current.children;

            if (isComponent(tag)) {
                Component.beforeRender(current.instance);
                if (!sameOuter || current.instance.state !== current.state) {
                    current.props = props;
                    current.children = children;
                    current.state = current.instance.state;
                    if (!sameOuter) {
                        Component.setProps(current.instance, props, children);
                    }
                    current.lastRender = Component.render(current.instance).exec(position);
                }
            } else if (!sameOuter) {
                current = {
                    tag,
                    props,
                    children,
                    lastRender: tag({ props, children, jsx }).exec(position)
                };
            }
        }

        return current.lastRender;
    };
}

function componentStringify(config, jsx) {
    return function(tag, props, children, position) {
        // TODO it seems no need right position on server?
        // position = calcComponentPosition(tag, props, position);

        if (tag.prototype instanceof Component) {
            const instance = new tag(props, children, { position, jsx });
            Component.beforeRender(instance);

            return instance.render(instance).exec(position);
        } else {
            return tag({ props, children, jsx }).exec(position);
        }
    };
}

function calcComponentPosition(tag, props, position) {
    // TODO warning if many instances of singleton or with same key
    if (tag.singleton) {
        return `__s__${getFunctionName(tag)}`;
    } else if (props.key) {
        return `__k__${props.key}`;
    } else {
        return `${position}.${getFunctionName(tag)}`;
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
            : children, position);
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
