function Position(id, positionPrefix, position) {
    this.id = id;
    this.positionPrefix = positionPrefix;
    this.position = position;
}

Position.prototype = {
    updateId(id) {
        return new Position(id, this.positionPrefix, this.position);
    },

    addPositionLevel() {
        return new Position(this.id, this.positionPrefix + '.childNodes', -1);
    },

    incrementPosition() {
        this.position++;
    },

    getPosition() {
        return `${this.positionPrefix}.${this.position}`;
    }
};

export default Position;
