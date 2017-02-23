function Patch () {
    this.patch = [];
}

Patch.prototype = {
    apply(rootNode) {
        return rootNode;
    },

    push(action) {
        this.patch.push(action);
    },

    replace(position, node) {
        return {
            type: 'replace',
            position,
            node
        };
    }
};

export default Patch;
