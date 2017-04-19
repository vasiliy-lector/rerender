function Tag(tag, attrs, position, id) {
    this.tag = tag;
    this.attrs = attrs;
    this.position = position;
    this.id = id;
}

Tag.prototype = {
    type: 'Tag'
};

export default Tag;
