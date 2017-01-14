import { escapeAttr, escapeHtml } from './utils.js';

function Template(template) {
    this.template = template;
}

Template.prototype = {
    exec(position) {
        return this.template(position);
    },
    type: 'Template'
};

function VText(value) {
    this.value = value;
}

VText.prototype = {
    type: 'VText'
};

function VNode(tag, attrs, children) {
    this.tag = tag;
    this.attrs = attrs;
    this.children = children;
}

VNode.prototype = {
    type: 'VNode'
};

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

function template(template) {
    return new Template(template);
}

function childValue(value, config, position) {
    if (Array.isArray(value)) {
        for (var i = 0, l = value.length, expanded = []; i < l; i++) {
            expanded.push(childValue(value[i], config, `${position}.${i}`));
        }

        return expanded;
    } else if (typeof value === 'string') {
        return config.text(value);
    } else if (typeof value === 'function') {
        return value.type === 'Template' ? value.exec(position) : childValue(value(), config, position);
    } else {
        return config.text(!value ? '' : value + '');
    }
}

function component(config, jsx) {
    return function(tag, attrs, children, position) {
        // TODO all logic with should update
        if (tag.prototype.render) {
            var instance = new tag(attrs, children, { position, jsx });
            return instance.render(instance);
        } else {
            return tag({
                props: attrs,
                children,
                jsx
            });
        }
    };
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

function convertAttrName(name) {
    return name === 'className' ? 'class' : name;
}

function tagStringify() {
    return function (tag, attrs, children, position) {
        let attrsString = '';

        for (let i = 0, attrsKeys = Object.keys(attrs), l = attrsKeys; i < l; i++) {
            const key = attrsKeys[i];

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

export { component, childValue, text, template, tag };
