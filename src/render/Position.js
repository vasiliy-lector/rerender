function Position(id, parentPosition, index) {
    this.id = id;
    this.parentPosition = parentPosition;
    this.index = index;
}

Position.prototype = {
    updateId(id) {
        return new Position(id, this.parentPosition, this.index);
    },

    addPositionLevel() {
        return new Position(this.id, this.getPosition(), -1);
    },

    incrementPosition() {
        this.index++;
    },

    getPosition() {
        return `${this.parentPosition}.childNodes.${this.index}`;
    },

    getParentPosition() {
        return this.parentPosition;
    },

    getIndex() {
        return this.index;
    }
};

export default Position;
