function VNode(tag, attrs, children) {
    this.tag = tag;
    this.attrs = attrs;
    this.children = children;
}

VNode.prototype = {
    type: 'VNode'
};

export default VNode;
