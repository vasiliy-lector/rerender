const types = {
    REPLACE: 'REPLACE', // replace node
    SET_REF: 'SET_REF', // set ref on node
    SPLIT_TEXT: 'SPLIT_TEXT', // split text nodes to normalize ssr
    UPDATE: 'UPDATE', // update attributes of node
    UPDATE_EVENTS: 'UPDATE_EVENTS' // update events only
};

function Patch () {
    this.patch = [];
}

Patch.prototype = {
    apply(rootNode) {
        return rootNode;
    },

    replace(position, node) {
        this.patch.push([
            types.REPLACE,
            position,
            node
        ]);
    },

    setRef(position, ref) {
        this.patch.push([
            types.SET_REF,
            position,
            ref
        ]);
    },

    splitText(position, end) {
        this.patch.push([
            types.SPLIT_TEXT,
            position,
            end
        ]);
    },

    updateEvents(position, events) {
        this.patch.push([
            types.UPDATE_EVENTS,
            position,
            events
        ]);
    }
};

export default Patch;
