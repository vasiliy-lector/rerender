import { createElement } from './createElement';
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
    this.commands = [];
    this.domNode = domNode;
    this.document = document;
    this.normalize = normalize;
    this.toMove = {};
    this.toCreate = {};
    this.created = {};
}

Patch.prototype = {
    apply() {
        if (!this.normalize) {
            this._setRefs();
        }

        for (let i = 0, l = this.commands.length; i < l; i++) {
            const command = this.commands[i];

            this[command[0]](command);
        }
    },

    applyCreate(command) {
        const node = command[2];
        let nextDomNode;

        if (node.type === 'Tag') {
            nextDomNode = createElement(node.tag, node.attrs, command[3], this.document);
        }

        const parentNode = this._getRefByPosition(command[1]);
        parentNode.appendChild(nextDomNode);
    },
    applyMove() {},
    applyRemove() {
        // should remove refs and etc
    },
    applyReplace(command) {
        const node = command[2];
        let nextDomNode;

        if (node.type === 'Tag') {
            nextDomNode = createElement(node.tag, node.attrs, command[3], this.document);
        } else {
            nextDomNode = this.document.createTextNode(node.value);
        }

        command[1].replaceWith(nextDomNode);
    },
    applySetRef() {},
    applySplitText() {},
    applyUpdate() {},
    applyUpdateEvents() {},

    _setRefs() {
        for (let i = 0, l = this.commands.length; i < l; i++) {
            if (this.commands[i][0] !== types.CREATE) {
                this.commands[i][1] = this._getRefByPosition(this.commands[i][1]);
            }
        }
    },

    _getRefByPosition(position) {
        return (new Function('domNode', `return domNode${position};`))(this.domNode);
    },

    create(parentPosition, index, node) {
        this.toCreate[node.id] = true;
        this.commands.push([
            types.CREATE,
            parentPosition,
            index,
            node
        ]);
    },

    move(position, nextPosition, node) {
        this.toMove[node.id] = true;
        this.commands.push([
            types.MOVE,
            position,
            nextPosition
        ]);
    },

    remove(position) {
        this.commands.push([
            types.REMOVE,
            position
        ]);
    },

    replace(position, node) {
        this.commands.push([
            types.REPLACE,
            position,
            node
        ]);
    },

    setRef(position, ref) {
        this.commands.push([
            types.SET_REF,
            position,
            ref
        ]);
    },

    splitText(position, end) {
        this.commands.push([
            types.SPLIT_TEXT,
            position,
            end
        ]);
    },

    update(position, attrs) {
        this.commands.push([
            types.UPDATE,
            position,
            attrs
        ]);
    },

    updateEvents(position, events) {
        this.commands.push([
            types.UPDATE_EVENTS,
            position,
            events
        ]);
    }
};

export default Patch;
export { types };
