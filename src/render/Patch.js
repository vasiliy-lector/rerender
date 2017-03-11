import { createTag, createText } from '../virtualDom/createElement';
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
    this.createdByReplace = {};
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
        const nextNode = command[3];
        if (this.createdByReplace[nextNode.id] === undefined) {
            const nextDomNode = nextNode.type === 'Tag'
                ? createTag(nextNode.tag, nextNode.attrs, this.document)
                : createText(nextNode.value, this.document);
            const parentNode = this._getRefByPosition(command[1]);
            parentNode.appendChild(nextDomNode);
        }
    },
    applyMove(command) {
        command[1].parentNode.replaceChild(createText('', this.document), command[1]);
        const container = this._getRefByPosition(command[2]);
        if (container.childNodes[command[3]]) {
            container.replaceChild(command[1]);
        } else {
            container.appendChild(command[1]);
        }
    },
    applyRemove() {
        // should remove refs and etc
    },
    applyReplace(command) {
        const nextNode = command[2];
        const nextDomNode = this._createElementWithChilds(nextNode);

        if (command[1].parentNode) {
            command[1].parentNode.replaceChild(
                nextDomNode,
                command[1]
            );
        }
    },
    applySetRef() {},
    applySplitText() {},
    applyUpdate() {},
    applyUpdateEvents() {},

    _createElementWithChilds(nextNode) {
        let nextDomNode;
        this.createdByReplace[nextNode.id] = true;

        if (nextNode.type === 'Tag') {
            nextDomNode = createTag(nextNode.tag, nextNode.attrs, this.document);

            if (!this.toMove[nextNode.id]) {
                for (let i = 0, l = nextNode.childNodes.length; i < l; i++) {
                    nextDomNode.appendChild(this._createElementWithChilds(nextNode.childNodes[i]));
                }
            } else {
                return createText('', this.document);
            }
        } else {
            nextDomNode = createText(nextNode.value, this.document);
        }

        return nextDomNode;
    },

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
        this.commands.push([
            types.CREATE,
            parentPosition,
            index,
            node
        ]);
    },

    move(position, parentPosition, index, node) {
        this.toMove[node.id] = true;
        this.commands.push([
            types.MOVE,
            position,
            parentPosition,
            index
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
