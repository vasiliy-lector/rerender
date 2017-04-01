function createText(value, document) {
    return document.createTextNode(value);
}

function createTag(tag, attrs, document) {
    const node = document.createElement(tag);

    for (let name in attrs.common) {
        node[name] = attrs.common[name];
    }

    for (let name in attrs.events) {
        node[name] = attrs.events[name];
    }

    return node;
}

function createAndAppend(node, parent, document) {
    const elem = node.type === 'Tag'
        ? createTagWithChilds(node.tag, node.attrs, node.childNodes, document)
        : createText(node.value, document);
    parent.appendChild(elem);

    return elem;
}

function createTagWithChilds(tag, attrs, childNodes, document) {
    const elem = createTag(tag, attrs, document);

    for (let i = 0, l = childNodes.length; i < l; i++) {
        createAndAppend(childNodes[i], elem, document);
    }

    return elem;
}

export default function createElement(node, document) {
    const elem = node.type === 'Tag'
        ? createTagWithChilds(node.tag, node.attrs, node.childNodes, document)
        : createText(node.value, document);

    return elem;
}

export {
    createTag,
    createText,
    createTagWithChilds
};
