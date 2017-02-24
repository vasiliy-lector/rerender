const types = {
    CREATE: 'CREATE',
    MOVE: 'MOVE',
    REMOVE: 'REMOVE',
    REPLACE: 'REPLACE',
    SET_REF: 'SET_REF',
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

    create(position, node) {
        this.patch.push([
            types.CREATE,
            position,
            node
        ]);
    },

    move(oldPosition, position) {
        this.patch.push([
            types.MOVE,
            oldPosition,
            position
        ]);
    },

    remove(position) {
        this.patch.push([
            types.REMOVE,
            position
        ]);
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

    update(position, attrs) {
        this.patch.push([
            types.UPDATE,
            position,
            attrs
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
