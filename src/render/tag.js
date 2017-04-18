import { escapeAttr } from '../utils';
import { diffAttrs } from './Attrs';
import Tag from '../virtualDom/Tag';

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

function tag(config) {
    if (config.stringify) {
        return tagStringify(config);
    } else if (config.method === 'create') {
        return tagDom(config);
    } else {
        return tagDiff(config);
    }
}

function tagDom({ nextNodes, patch }) {
    return function (tag, attrs, children, position) {
        position.incrementPosition();

        const nextNodePosition = position.getPosition();
        const nextNode = new Tag(tag, attrs, nextNodePosition, position.id);

        if (attrs.events.length > 0) {
            patch.attachEvents(nextNodePosition, attrs.events);
        }

        if (typeof attrs.special.ref === 'function') {
            patch.setRef(nextNodePosition, attrs.special.ref);
        }

        nextNodes[position.id] = nextNode;
        nextNode.parentNode = position.getParentNode();
        nextNode.childNodes = children(nextNode);

        return nextNode;
    };
}

function tagDiff(config) {
    return function (tag, attrs, children, position) {
        position.incrementPosition();

        const { nodes, nextNodes, patch } = config;
        const node = nodes[position.id];
        const nextNodePosition = position.getPosition();
        let nextNode = node;

        if (!node) {
            nextNode = new Tag(tag, attrs, nextNodePosition, position.id);
            patch.create(position.getParentPosition(), position.getIndex(), nextNode);
        } else {
            if (node.tag !== tag) {
                nextNode = new Tag(tag, attrs, nextNodePosition, position.id);
                patch.replace(nextNodePosition, nextNode);
            // TODO: здесь сравнивать relativePosition
            } else if (/u[^.]+\.0$/.test(node.position.id) && node.position !== nextNodePosition) {
                patch.move(node.position, position.getParentPosition(), position.getIndex(), nextNode);
                nextNode.position = position;
            }

            if (node.attrs !== attrs) {
                const diff = diffAttrs(node.attrs, attrs);

                if (diff) {
                    patch.update(nextNodePosition, diff);
                }
                nextNode.attrs = attrs;
            }
        }

        nextNodes[position.id] = nextNode;
        nextNode.parentNode = position.getParentNode();
        nextNode.childNodes = children(nextNode);
        delete nodes[position.id];

        return nextNode;
    };
}

function tagStringify() {
    return function (tag, attrs, children) {
        let attrsString = '';

        for (let key in attrs.common) {
            if (key === 'dataset') {
                const value = attrs.common[key],
                    datasetKeys = Object.keys(value);

                for (let j = 0, n = datasetKeys.length; j < n; j++) {
                    attrsString += ` data-${datasetKeys[j]}="${escapeAttr(value[datasetKeys[j]])}"`;
                }
            } else if (key === 'style') {
                attrsString += ` style="${escapeStyle(attrs.common[key])}"`;
            } else {
                const value = attrs.common[key];

                attrsString += ' ' + convertAttrName(key) + (value ===  true
                    ? ''
                    : `="${escapeAttr(value)}"`);
            }
        }

        const childrenString = children.join('');

        return '<' + tag + attrsString +
            (childrenString === '' && VOID_TAGS[tag]
                ? ' />'
                : '>' + childrenString + '</' + tag + '>');
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
