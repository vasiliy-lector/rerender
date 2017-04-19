function Text(value, position, id) {
    this.value = value || '';
    this.position = position;
    this.id = id;
}

Text.prototype = {
    type: 'Text'
};

export default Text;
