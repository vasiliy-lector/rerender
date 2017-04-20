import { TEMPLATE, TEMPLATE_VNODE } from '../types';
import { escapeAttr, escapeHtml } from '../../utils';
const VOID_TAGS = {
    area: true,
    base: true,
    br: true,
    col: true,
    embed: true,
    hr: true,
    img: true,
    input: true,
    keygen: true,
    link: true,
    meta: true,
    param: true,
    source: true,
    track: true,
    wbr: true
};

function TemplateVNode(instance, props, children) {
    this.instance = instance;
    this.props = props;
    this.children = children;
}

TemplateVNode.prototype = {
    type: TEMPLATE,
    subtype: TEMPLATE_VNODE,

    render(config) {
        if (typeof this.instance === 'string') {
            return this.renderAsVNode(config);
        } else {
            return this.renderAsComponent(config);
        }
    },

    renderAttrs() {
        let attrs = '';
        const setted = {};

        if (this.props) {
            for (let i = this.props.length - 1; i > 0; i = i - 2) {
                const value = this.props[i];
                const name = this.props[i - 1];
                if (name === '...' && typeof value === 'object') {
                    for (let key in value) {
                        if (!setted[key]) {
                            attrs = renderAttr(key, value[key]) + attrs;
                            setted[key] = true;
                        }
                    }
                } else if (!setted[name]) {
                    attrs = renderAttr(name, value) + attrs;
                    setted[name] = true;
                }
            }
        }

        return attrs;
    },

    renderChildrens(config) {
        let children = '';

        if (this.children) {
            for (let i = 0, l = this.children.length; i < l; i++) {
                children += renderChildren(this.children[i], config);
            }
        }

        return children;
    },

    renderAsVNode(config) {
        const tag = this.instance;
        const children = this.renderChildrens(config);

        return '<' + tag + this.renderAttrs() +
            (children === '' && VOID_TAGS[tag]
                ? ' />'
                : '>' + children + '</' + tag + '>');
    },

    renderAsComponent() {}
};

function renderChildren(item, config) {
    const type = typeof item;
    let children = '';

    if (type === 'object' && item.type === TEMPLATE) {
        children += item.render(config);
    } else if (Array.isArray(item)) {
        for (let j = 0, l1 = item.length; j < l1; j++) {
            children += renderChildren(item[j], config);
        }
    } else if (item) {
        children += escapeHtml(item);
    }

    return children;
}

function renderAttr(name, value) {
    if (name.substr(0, 2) === 'on') {
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

function escapeStyle(value) {
    let styleString;

    if (typeof value === 'object') {
        styleString = '';

        for (var prop in value) {
            styleString += convertStyleKey(prop) + `:${value[prop]};`;
        }
    } else {
        styleString = value;
    }

    return escapeAttr(styleString);
}

function convertAttrName(name) {
    return name === 'className' ? 'class' : name;
}

const STYLE_ATTRS = {
    animation: 'animation',
    background: 'background',
    backgroundAttachment: 'background-attachment',
    backgroundClip: 'background-clip',
    backgroundColor: 'background-color',
    backgroundImage: 'background-image',
    backgroundOrigin: 'background-origin',
    backgroundPosition: 'background-position',
    backgroundRepeat: 'background-repeat',
    backgroundSize: 'background-size',
    border: 'border',
    borderBottom: 'border-bottom',
    borderColor: 'border-color',
    borderLeft: 'border-left',
    borderRadius: 'border-radius',
    borderRight: 'border-right',
    borderStyle: 'border-style',
    borderTop: 'border-top',
    borderWidth: 'border-width',
    bottom: 'bottom',
    boxShadow: 'box-shadow',
    clear: 'clear',
    clip: 'clip',
    color: 'color',
    display: 'display',
    float: 'float',
    font: 'font',
    fontFamily: 'font-family',
    fontSize: 'font-size',
    fontStyle: 'font-style',
    fontWeight: 'font-weight',
    height: 'height',
    id: 'id',
    left: 'left',
    lineHeight: 'line-height',
    margin: 'margin',
    marginBottom: 'margin-bottom',
    marginLeft: 'margin-left',
    marginRight: 'margin-right',
    marginTop: 'margin-top',
    maxHeight: 'max-height',
    maxWidth: 'max-width',
    minHeight: 'min-height',
    minWidth: 'min-width',
    overflow: 'overflow',
    overflowX: 'overflow-x',
    overflowY: 'overflow-y',
    opacity: 'opacity',
    padding: 'padding',
    paddingBottom: 'padding-bottom',
    paddingLeft: 'padding-left',
    paddingRight: 'padding-right',
    paddingTop: 'padding-top',
    position: 'position',
    right: 'right',
    textAlign: 'text-align',
    textIndent: 'text-indent',
    textJustify: 'text-justify',
    textOverflow: 'text-overflow',
    textShadow: 'text-shadow',
    top: 'top',
    transition: 'transition',
    transitionDelay: 'transition-delay',
    transitionDuration: 'transition-duration',
    transitionProperty: 'transition-property',
    transitionTimingFunction: 'transition-timing-function',
    verticalAlign: 'vertical-align',
    visibility: 'visibility',
    width: 'width',
    zIndex: 'z-index'
};
const UPPER_CASE = /[A-Z]/g;

function convertStyleKey(key) {
    return STYLE_ATTRS[key] || convertStyleKeyHeavy(key);
}

function convertStyleKeyHeavy(key) {
    return String(key).replace(UPPER_CASE, convertUpper);
}

function convertUpper(match) {
    return '-' + match.toLowerCase();
}

export { renderAttr };
export default TemplateVNode;
