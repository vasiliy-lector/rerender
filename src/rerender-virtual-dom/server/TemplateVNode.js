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

    renderAttrs() {
        let attrs = '';

        if (!this.props) {
            return attrs;
        }

        for (let name in this.props) {
            attrs += renderAttr(name, this.props[name]);
        }

        return attrs;
    },

    renderChildNodes(config) {
        let childNodes = '';

        if (this.children) {
            for (let i = 0, l = this.children.length; i < l; i++) {
                childNodes += renderChildren(this.children[i], config);
            }
        }

        return childNodes;
    },

    render(config) {
        const tag = this.instance;
        const childNodes = this.renderChildNodes(config);

        return '<' + tag + this.renderAttrs() +
            (childNodes === '' && VOID_TAGS[tag]
                ? ' />'
                : '>' + childNodes + '</' + tag + '>');
    }
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

const SPECIAL_MEANING_ATTRS = {
    ref: true,
    key: true,
    uniqid: true
};

function renderAttr(name, value) {
    if (name.substr(0, 2) === 'on' || SPECIAL_MEANING_ATTRS[name]) {
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
