function createText(node, document) {
    return document.createTextNode(node.value);
}

function createTag(tag, attrs, document) {
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
    const elem = node.type === 'Tag'
        ? createTagWithChilds(node.tag, node.attrs, node.childNodes, document)
        : createText(node.value);
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
        : createText(node.value);

    return elem;
}

export {
    createTag
};
