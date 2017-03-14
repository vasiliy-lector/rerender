import { createTag, createText } from '../virtualDom/createElement';
const types = {
    ATTACH_EVENTS: 'applyAttachEvents', // attach event to server side html
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
    this.setRefCommands = [];
    this.splitTextCommands = [];
    this.eventsCommands = [];
    this.domNode = domNode;
    this.document = document;
    this.toMove = {};
    this.willCreatedWithChilds = {};
}

Patch.prototype = {
    apply() {
        this.setRefs();

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
        this.replaceChild(command[1], command[2], this.createElementWithChilds(nextNode));
    },
    applyMove(command) {
        command[1].parentNode.replaceChild(createText('', this.document), command[1]);
        this.replaceChild(command[2], command[3], command[1]);
    },
    applyRemove() {
        // should remove refs and etc
    },
    applyReplace(command) {
        const nextNode = command[2];
        const nextDomNode = this.createElementWithChilds(nextNode);

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

    applyAttachEvents(command) {
        const node = this.getRefByPosition(command[1]);
        const events = command[2];

        for (let i = 0, l = events.length; i < l; i++) {
            node[events[i][0]] = events[i][1];
        }
    },

    createElementWithChilds(nextNode) {
        let nextDomNode;

        if (nextNode.type === 'Tag') {
            if (!this.toMove[nextNode.id]) {
                nextDomNode = createTag(nextNode.tag, nextNode.attrs, this.document);

                if (typeof nextNode.attrs.special.ref === 'function') {
                    nextNode.attrs.special.ref(nextDomNode);
                }

                for (let i = 0, l = nextNode.childNodes.length; i < l; i++) {
                    nextDomNode.appendChild(this.createElementWithChilds(nextNode.childNodes[i]));
                }
            } else {
                nextDomNode = createText('', this.document);
            }
        } else {
            nextDomNode = createText(nextNode.value, this.document);
        }

        return nextDomNode;
    },

    setRefs() {
        for (let i = 0, l = this.commands.length; i < l; i++) {
            if (this.commands[i][0] !== types.CREATE) {
                this.commands[i][1] = this.getRefByPosition(this.commands[i][1]);
            }
        }
    },

    getRefByPosition(position) {
        return (new Function('domNode', `return domNode${position};`))(this.domNode);
    },

    replaceChild(parentPosition, index, nextDomNode) {
        const container = this.getRefByPosition(parentPosition);
        const domNode = container.childNodes[index];

        if (domNode) {
            container.replaceChild(nextDomNode, domNode);
        } else {
            container.appendChild(nextDomNode);
        }
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
        this.setRefCommands.push([
            types.SET_REF,
            position,
            ref
        ]);
    },

    splitText(position, end) {
        this.splitTextCommands.push([
            types.SPLIT_TEXT,
            position,
            end
        ]);
    },

    update(position, diff) {
        this.commands.push([
            types.UPDATE,
            position,
            diff
        ]);
    },

    attachEvents(position, events) {
        this.eventsCommands.push([
            types.ATTACH_EVENTS,
            position,
            events
        ]);
    }
};

export default Patch;
export { types };
