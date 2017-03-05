function Text(value, position) {
    this.value = value || '';
    this.position = position;
}

Text.prototype = {
    type: 'Text'
};

export default Text;
