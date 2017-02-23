const types = {
    REPLACE: 'REPLACE',
    SPLIT_TEXT: 'SPLIT_TEXT'
};

function Patch () {
    this.patch = [];
}

Patch.prototype = {
    apply(rootNode) {
        return rootNode;
    },

    push(action) {
        this.patch.push(action);
    }
};

export default Patch;
export { types };
