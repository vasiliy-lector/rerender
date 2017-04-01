function Position(id, domPosition) {
    this.id = id;
    this.domPosition = domPosition;
}

Position.prototype = {
    updateId(id) {
        return new Position(id, this.domPosition);
    },

    addPositionLevel(parentNode) {
        return new Position(this.id, { parentNode, parentPosition: this.getPosition(), index: -1 });
    },

    incrementPosition() {
        this.domPosition.index++;
    },

    getPosition() {
        return `${this.domPosition.parentPosition}.childNodes[${this.domPosition.index}]`;
    },

    getParentPosition() {
        return this.domPosition.parentPosition;
    },

    getParentNode() {
        return this.domPosition.parentNode;
    },

    getIndex() {
        return this.domPosition.index;
    }
};

export default Position;
