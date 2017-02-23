function createElement(tag, attrs, childNodes, document) {
    const elem = document.createElement(tag);

    if (attrs !== null) {
        for (let name in attrs) {
            elem[name] = attrs[name];
        }
    }

    for (let i = 0, l = childNodes.length; i < l; i++) {
        const child = createElement(childNodes[i], document);
        if (child !== undefined) {
            elem.appendChild(child);
        }
    }

    return elem;
}

export default createElement;
