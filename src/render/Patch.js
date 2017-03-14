import { createTag, createText } from '../virtualDom/createElement';
const types = {
    CREATE: 'applyCreate',
    MOVE: 'applyMove',
    REMOVE: 'applyRemove',
    REPLACE: 'applyReplace',
    SET_REF: 'applySetRef',
    SPLIT_TEXT: 'applySplitText', // split text nodes to normalize ssr
    UPDATE: 'applyUpdate' // update attributes of node
};

function Patch (domNode, document) {
    this.commands = [];
    this.normalizeCommands = [];
    this.setRefCommands = [];
    this.domNode = domNode;
    this.document = document;
    this.toMove = {};
    this.willCreatedWithChilds = {};
}

Patch.prototype = {
    apply() {
        this._setRefs();

        for (let i = 0, l = this.commands.length; i < l; i++) {
            const command = this.commands[i];

            this[command[0]](command);
        }
    },

    applyNormalize() {

    },

    applySetRefs() {

    },

    applyCreate(command) {
        const nextNode = command[3];
        this._replaceChild(command[1], command[2], this._createElementWithChilds(nextNode));
    },
    applyMove(command) {
        command[1].parentNode.replaceChild(createText('', this.document), command[1]);
        this._replaceChild(command[2], command[3], command[1]);
    },
    applyRemove() {
        // should remove refs and etc
    },
    applyReplace(command) {
        const nextNode = command[2];
        const nextDomNode = this._createElementWithChilds(nextNode);

        // if (command[1].parentNode) {
        command[1].parentNode.replaceChild(
            nextDomNode,
            command[1]
        );
        // }
    },
    applySetRef() {},
    applySplitText() {},
    applyUpdate(command) {
        const node = command[1];
        const diff = command[2];

        if (diff.common) {
            if (diff.common[0]) {
                for (let i = 0, l = diff.common[0].length; i < l; i++) {
                    node[diff.common[0][i][0]] = diff.common[0][i][1];
                }
            }
            if (diff.common[1]) {
                for (let i = 0, l = diff.common[1].length; i < l; i++) {
                    node[diff.common[1][i]] = null;
                }
            }
        }

        if (diff.events) {
            if (diff.events[0]) {
                for (let i = 0, l = diff.events[0].length; i < l; i++) {
                    node[diff.events[0][i][0]] = diff.events[0][i][1];
                }
            }

            if (diff.events[1]) {
                for (let i = 0, l = diff.events[1].length; i < l; i++) {
                    node[diff.events[1][i]] = null;
                }
            }
        }
    },

    _replaceChild(parentPosition, index, nextDomNode) {
        const container = this._getRefByPosition(parentPosition);
        const domNode = container.childNodes[index];

        if (domNode) {
            container.replaceChild(nextDomNode, domNode);
        } else {
            container.appendChild(nextDomNode);
        }
    },

    _createElementWithChilds(nextNode) {
        let nextDomNode;

        if (nextNode.type === 'Tag') {
            if (!this.toMove[nextNode.id]) {
                nextDomNode = createTag(nextNode.tag, nextNode.attrs, this.document);

                if (typeof nextNode.attrs.special.ref === 'function') {
                    nextNode.attrs.special.ref(nextDomNode);
                }

                for (let i = 0, l = nextNode.childNodes.length; i < l; i++) {
                    nextDomNode.appendChild(this._createElementWithChilds(nextNode.childNodes[i]));
                }
            } else {
                nextDomNode = createText('', this.document);
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
        this.willCreatedWithChilds[node.position];

        if (this.willCreatedWithChilds[parentPosition] === undefined) {
            this.commands.push([
                types.CREATE,
                parentPosition,
                index,
                node
            ]);
        }
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
        this.willCreatedWithChilds[position] = true;

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

    update(position, setAttrs, removeAttrs) {
        this.commands.push([
            types.UPDATE,
            position,
            setAttrs,
            removeAttrs
        ]);
    }
};

export default Patch;
export { types };
