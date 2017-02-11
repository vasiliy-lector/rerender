function Position(absolute, instantPrefix, instantPosition) {
    this.absolute = absolute;
    this.instantPrefix = instantPrefix;
    this.instantPosition = instantPosition;
}

Position.prototype = {
    updateAbsolute(absolute) {
        return new Position(absolute, this.instantPrefix, this.instantPosition);
    },

    addInstantLevel() {
        return new Position(this.absolute, this.instantPrefix + '.childNodes', -1);
    },

    incrementInstant() {
        this.instantPosition++;
    },

    getInstant() {
        return `${this.instantPrefix}.${this.instantPosition}`;
    }
};

export default Position;
