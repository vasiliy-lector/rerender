function Tag(tag, attrs, position) {
    this.tag = tag;
    this.attrs = attrs;
    this.position = position;
}

Tag.prototype = {
    type: 'Tag',

    setChildNodes(childNodes) {
        this.childNodes = childNodes;
    },

    setParentNode(parentNode) {
        this.parentNode = parentNode;
    }
};

export default Tag;
