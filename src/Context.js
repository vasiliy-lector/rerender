function Context() {
}

Context.prototype = {
    addIdLevel(component, node) {
        // вернуть новый Context, в котором в parentId зафиксировать
        // текущий id, idIndex в новом Context сбросить к нулю
    },

    addDomLevel(node) {
    },

    incrementId(key, uniqid) {
    },

    incrementDom(key, uniqid) {
    },

    setDomParent(vNode) {

    },

    getId() {
        return this.id;
    },

    getPosition() {
        return this.relativeParent.position + this.relativePosition;
    },

    getDomId() {
        return this.relativeParent.id + this.relativePosition;
    },

    getParent() {

    },

    getParentNode() {

    }
};

export default Context;
