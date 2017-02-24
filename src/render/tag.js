import { escapeAttr } from '../utils';

function Tag(tag, attrs, position) {
    this.tag = tag;
    this.attrs = attrs;
    this.position = position;
}

Tag.prototype = {
    type: 'Tag'
};

function tag(config) {
    if (config.stringify) {
        return tagStringify(config);
    } else if (config.method === 'create') {
        return tagDom(config);
    } else {
        return tagDiff(config);
    }
}

function tagDom({ nextNodes, document, normalizePatch }) {
    return function (tag, attrs, children, position) {
        nextNodes[position.id] = new Tag(tag, attrs, position);

        if (attrs.events.length > 0) {
            normalizePatch.updateEvents(position.getPosition(), attrs);
        }

        if (typeof attrs.special.ref === 'function') {
            normalizePatch.setRef(position.getPosition(), attrs.special.ref);
        }

        return createElement(tag, attrs, children, document);
    };
}

function tagDiff({ nextNodes, document }) {
    return function (tag, attrs, children, position) {
        nextNodes[position.id] = new Tag(tag, attrs, position);

        return createElement(tag, attrs, children, document);
    };
}

function tagStringify() {
    return function (tag, attrs, children) {
        let attrsString = '';

        for (let i = 0, l = attrs.common.length; i < l; i++) {
            const key = attrs.common[i][0];

            if (key === 'dataset') {
                const value = attrs.common[i][1],
                    datasetKeys = Object.keys(value);

                for (let j = 0, n = datasetKeys.length; j < n; j++) {
                    attrsString += ` data-${datasetKeys[j]}="${escapeAttr(value[datasetKeys[j]])}"`;
                }
            } else if (key === 'style') {
                attrsString += ` style="${escapeStyle(attrs.common[i][1])}"`;
            } else {
                const value = attrs.common[i][1];

                attrsString += ' ' + convertAttrName(key) + (value ===  true
                    ? ''
                    : `="${escapeAttr(value)}"`);
            }
        }

        const childrenString = children.join('');

        return '<' + tag + attrsString +
            (childrenString !== ''
                ? '>' + childrenString + '</' + tag + '>'
                : ' />');
    };
}

function createElement(tag, attrs, children, document) {
    const elem = document.createElement(tag);

    for (let i = 0, l = attrs.common.length; i < l; i++) {
        elem[attrs.common[i][0]] = attrs.common[i][1];
    }

    for (let i = 0, l = attrs.events.length; i < l; i++) {
        elem[attrs.events[i][0].toLowerCase()] = attrs.events[i][1];
    }

    for (let i = 0, l = children.length; i < l; i++) {
        if (children[i]) {
            elem.appendChild(children[i]);
        }
    }

    return elem;
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
