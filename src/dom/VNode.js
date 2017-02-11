function VNode(tag, attrs, children, absolutePosition, instantPosition) {
    this.tag = tag;
    this.attrs = attrs;
    this.childNodes = children;
    this.absolutePosition = absolutePosition;
    this.instantPosition = instantPosition;
}

VNode.prototype = {
    type: 'VNode'
};

export default VNode;
