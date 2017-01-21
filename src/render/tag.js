import { escapeAttr } from '../utils';
import VNode from '../dom/VNode';

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

        if (attrs !== null) {
            for (var key in attrs) {
                // TODO key === 'key'?
                if (key.substr(0, 2) === 'on' || key === 'ref') {
                    continue;
                } else if (key === 'dataset') {
                    const value = attrs[key],
                        datasetKeys = Object.keys(value);

                    for (let i = 0, l = datasetKeys.length; i < l; i++) {
                        attrsString += ` data-${datasetKeys[i]}="${escapeAttr(value[datasetKeys[i]])}"`;
                    }
                } else if (key === 'style') {
                    attrsString += ` style="${escapeStyle(attrs[key])}"`;
                } else {
                    const value = attrs[key];

                    attrsString += ' ' + convertAttrName(key) + (value ===  true
                        ? ''
                        : `="${escapeAttr(value)}"`);
                }
            }
        }

        const childrenString = children.join('');

        return '<' + tag + attrsString +
            (childrenString !== ''
                ? '>' + childrenString + '</' + tag + '>'
                : ' />');
    };
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

export default tag;
export { escapeStyle };
