function Position(id, instantPrefix, instantPosition) {
    this.id = id;
    this.instantPrefix = instantPrefix;
    this.instantPosition = instantPosition;
}

Position.prototype = {
    updateAbsolute(id) {
        return new Position(id, this.instantPrefix, this.instantPosition);
    },

    addInstantLevel() {
        return new Position(this.id, this.instantPrefix + '.childNodes', -1);
    },

    incrementInstant() {
        this.instantPosition++;
    },

    getInstant() {
        return `${this.instantPrefix}.${this.instantPosition}`;
    }
};

export default Position;
