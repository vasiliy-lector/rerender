function Tag(tag, attrs, position) {
    this.tag = tag;
    this.attrs = attrs;
    this.position = position;
}

Tag.prototype = {
    type: 'Tag'
};

export default Tag;
