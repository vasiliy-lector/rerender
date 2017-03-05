function Node(tag, attrs, position) {
    this.tag = tag;
    this.attrs = attrs;
    this.position = position;
}

Node.prototype = {
    type: 'Node',

    setChildNodes(childNodes) {
        this.childNodes = childNodes;
    },

    setParentNode(parentNode) {
        this.parentNode = parentNode;
    }
};

export default Node;
