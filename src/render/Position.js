function Position(id, parentNode, parentPosition, index) {
    this.id = id;
    this.parentNode = parentNode;
    this.parentPosition = parentPosition;
    this.index = index;
}

Position.prototype = {
    updateId(id) {
        return new Position(id, this.parentNode, this.parentPosition, this.index);
    },

    addPositionLevel(parentNode) {
        return new Position(this.id, parentNode, this.getPosition(), -1);
    },

    incrementPosition() {
        this.index++;
    },

    getPosition() {
        return `${this.parentPosition}.childNodes[${this.index}]`;
    },

    getParentPosition() {
        return this.parentPosition;
    },

    getParentNode() {
        return this.parentNode;
    },

    getIndex() {
        return this.index;
    }
};

export default Position;
