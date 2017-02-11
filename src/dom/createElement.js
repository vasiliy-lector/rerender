function createElement(node, document) {
    if (node.type === 'VNode') {
        const elem = document.createElement(node.tag);

        if (node.attrs !== null) {
            for (let name in node.attrs) {
                elem[name] = node.attrs[name];
            }
        }

        for (let i = 0, l = node.childNodes.length; i < l; i++) {
            const child = createElement(node.childNodes[i], document);
            if (child !== undefined) {
                elem.appendChild(child);
            }
        }

        return elem;
    } else if (node.type === 'VText') {
        return document.createTextNode(node.value);
    }
}

export default createElement;
