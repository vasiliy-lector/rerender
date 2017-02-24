const types = {
    UPDATE: 'UPDATE', // update attributes of node
    UPDATE_EVENTS: 'UPDATE_EVENTS', // update events only
    REPLACE: 'REPLACE', // replace node
    SPLIT_TEXT: 'SPLIT_TEXT' // split text nodes to normalize ssr
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
