import { createElement } from './tag';
const types = {
    CREATE: 'applyCreate',
    MOVE: 'applyMove',
    REMOVE: 'applyRemove',
    REPLACE: 'applyReplace',
    SET_REF: 'applySetRef',
    SPLIT_TEXT: 'applySplitText', // split text nodes to normalize ssr
    UPDATE: 'applyUpdate', // update attributes of node
    UPDATE_EVENTS: 'applyUpdateEvents' // update events only
};

function Patch (domNode, document, normalize) {
    this.patch = [];
    this.domNode = domNode;
    this.document = document;
    this.normalize = normalize;
}

Patch.prototype = {
    apply(domNode) {
        if (!this.normalize) {
            this._setRefs();
        }

        for (let i = 0, l = this.patch.length; i < l; i++) {
            const action = this.patch[i];

            this[action[0]](action, domNode);
        }
    },

    applyCreate(action) {
        const node = action[2];
        let nextDomNode;

        if (node.type === 'Node') {
            nextDomNode = createElement(node.tag, node.attrs, null, this.document);
        }

        const parentNode = this._getRefByPosition(action[1]);
        parentNode.appendChild(nextDomNode);
    },
    applyMove() {},
    applyRemove() {},
    applyReplace() {},
    applySetRef() {},
    applySplitText() {},
    applyUpdate() {},
    applyUpdateEvents() {},

    _setRefs() {
        for (let i = 0, l = this.patch.length; i < l; i++) {
            if (this.patch[i][0] !== types.CREATE) {
                this.patch[i][1] = this._getRefByPosition(this.patch[i][1]);
            }
        }
    },

    _getRefByPosition(position) {
        return (new Function('domNode', `return domNode${position};`))(this.domNode);
    },

    create(parentPosition, index, node) {
        this.patch.push([
            types.CREATE,
            parentPosition,
            index,
            node
        ]);
    },

    move(position, nextPosition) {
        this.patch.push([
            types.MOVE,
            position,
            nextPosition
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
export { types };
