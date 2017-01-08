function RerenderTemplate(template) {
    this.template = template;
}

RerenderTemplate.prototype = {
    exec(position) {
        return this.template(position);
    },
    type: 'RerenderTemplate'
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

function renderText(config) {
    return function(value) {
        if (config.stringify) {
            return value;
        } else {
            return new VText(value);
        }
    }
}

function createTemplate(template) {
    return new RerenderTemplate(template);
}

function renderValue(value, config, position) {
    if (Array.isArray(value)) {
        for (var i = 0, l = value.length, expanded = []; i < l; i++) {
            expanded.push(expand(value[i], config, `${position}.${i}`));
        }

        return expanded;
    } else if (typeof value === 'string') {
        return config.renderText(value);
    } else if (typeof value === 'function') {
        return value.type === 'RerenderTemplate' ? value.exec(position) : expand(value(), config, position);
    } else {
        return config.renderText(!value ? '' : value + '')
    }
}

function renderComponent(config, jsx) {
    if (config.stringify) {
        return renderComponentToString(config, jsx);
    } else {
        return renderComponentToVDom(config, jsx);
    }
}

function renderComponentToString({ store }, jsx) {
    return function(tag, attrs, children, position) {
        return {
            tag,
            attrs,
            children
        };
    };
}

function renderComponentToVDom({ store, joinTextNodes, nextMounted }, jsx) {
    return function(tag, attrs, children, position) {
        if (typeof tag === 'function') {
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
        } else { // string
            return new VNode(tag, attrs, typeof children === 'function' ? children(position) : children);
        }
    };
}

export { renderComponent, renderValue, renderText, createTemplate };
