export default function createElement(node, document) {
    return node.type === 'Node'
        ? createNode(node.tag, node.attrs, document)
        : createText(node.value);
}

function createText(node, document) {
    return document.createTextNode(node.value);
}

function createNode(tag, attrs, document) {
    const elem = document.createElement(tag);

    for (let i = 0, l = attrs.common.length; i < l; i++) {
        elem[attrs.common[i][0]] = attrs.common[i][1];
    }

    for (let i = 0, l = attrs.events.length; i < l; i++) {
        elem[attrs.events[i][0].toLowerCase()] = attrs.events[i][1];
    }

    return elem;
}

function createAndAppend(node, parent, document) {
    const elem = createElement(node.tag, node.attrs, document);
    parent.appendChild(elem);

    return elem;
}

function createNodeWithChilds(tag, attrs, children, document) {
    const elem = createNode(tag, attrs, document);

    for (let i = 0, l = children.length; i < l; i++) {
        createAndAppend(children[i], elem, document);
    }

    return elem;
}

export { createAndAppend, createNodeWithChilds };
