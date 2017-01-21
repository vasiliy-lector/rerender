function createElement(node, document = self.document) {
    if (node.type === 'VNode') {
        const elem = document.createElement(node.tag);
        const attrKeys = Object.keys(node.attrs);

        for (let i = 0, l = attrKeys.length; i < l; i++) {
            const name = attrKeys[i];
            if (name.substr(0, 2) !== 'on') {
                elem.setAttribute(name, node.attrs[name]);
            }
        }

        for (let i = 0, l = node.children.length; i < l; i++) {
            const child = createElement(node.children[i]);
            if (child !== undefined) {
                elem.appendChild(child);
            }
        }

        return elem;
    } else if (node.type === 'VText') {
        return document.createTextNode(node.value);
    } else if (node.type === 'VComment') {
        return document.createComment('');
    }
}

export default createElement;
