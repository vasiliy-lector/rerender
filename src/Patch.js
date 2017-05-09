import { VNODE, VTEXT } from './types';

const CREATE = 'CREATE';
const MOVE = 'MOVE';
const REMOVE = 'REMOVE';
const REPLACE = 'REPLACE';
const UPDATE = 'UPDATE';
const SPLIT_TEXT = 'SPLIT_TEXT';
const SET_REF = 'SET_REF';
const ATTACH_EVENTS = 'ATTACH_EVENTS';

function Patch (document = self.document) {
    this.document = document;
    this.commands = [];
    this.setRefCommands = [];
    this.splitTextCommands = [];
    this.eventsCommands = [];
}

Patch.prototype = {
    apply() {
        const domNodes = [];
        const options = {
            document: this.document,
            skipCreation: {}
        };

        for (let i = 0, l = this.commands.length; i < l; i++) {
            const command = this.commands[i];

            if (command.type !== CREATE) {
                domNodes[i] = command.refNode.getDomNode();
                if (command.type === MOVE) {
                    options.skipCreation[command.nextNode.context.id] = true;
                }
            }
        }

        for (let i = 0, l = this.commands.length; i < l; i++) {
            this.commands[i].apply(domNodes[i], options);
        }
    },

    applyNormalize() {
        for (let i = 0, l = this.splitTextCommands.length; i < l; i++) {
            this.splitTextCommands[i].apply();
        }

        for (let i = 0, l = this.setRefCommands.length; i < l; i++) {
            this.setRefCommands[i].apply();
        }

        for (let i = 0, l = this.eventsCommands.length; i < l; i++) {
            this.eventsCommands[i].apply();
        }
    },

    push(command) {
        this.commands.push(command);
    },

    pushNormalize(command) {
        switch (command.type) {
            case SPLIT_TEXT:
                this.splitTextCommands.push(command);
                break;
            case SET_REF:
                this.setRefCommands.push(command);
                break;
            case ATTACH_EVENTS:
                this.eventsCommands.push(command);
                break;
        }
    }
};

function Create(nextNode) {
    this.nextNode = nextNode;
}
Create.prototype = {
    type: CREATE,

    apply() {}
};

function Move(nextNode, node) {
    this.nextNode = nextNode;
    this.node = node;
    this.refNode = node;
}
Move.prototype = {
    type: MOVE,

    apply() {}
};

function Remove(node) {
    this.node = node;
    this.refNode = node;
}
Remove.prototype = {
    type: REMOVE,

    apply() {}
};

function Replace(nextNode) {
    this.nextNode = nextNode;
    this.refNode = nextNode;
}
Replace.prototype = {
    type: REPLACE,

    apply(domNode, options) {
        const nextDomNode = createElement(this.nextNode, options.document, options.skipCreation);

        domNode.parentNode.replaceChild(
            nextDomNode,
            domNode
        );
    }
};

function SetRef(nextNode) {
    this.nextNode = nextNode;
    this.refNode = nextNode;
}
SetRef.prototype = {
    type: SET_REF,

    apply() {}
};

function SplitText(nextNode) {
    this.nextNode = nextNode;
    this.refNode = nextNode;
}
SplitText.prototype = {
    type: SPLIT_TEXT,

    apply(domNode) {
        domNode.splitText(this.nextNode.value.length);
    }
};

function Update(nextNode, node) {
    this.nextNode = nextNode;
    this.node = node;
    this.refNode = nextNode;
}
Update.prototype = {
    type: UPDATE,

    apply() {}
};

function AttachEvents(nextNode) {
    this.nextNode = nextNode;
    this.refNode = nextNode;
}
AttachEvents.prototype = {
    type: ATTACH_EVENTS,

    apply() {}
};

const specialAttrs = {
    ref: true,
    uniqid: true,
    key: true
};

function createElement(nextNode, document, skipCreation) {
    let nextDomNode;

    if (nextNode.type === VNODE) {
        if (!skipCreation[nextNode.context.id]) {
            nextDomNode = document.createElement(nextNode.tag);

            for (let name in nextNode.attrs) {
                if (!specialAttrs[name]) {
                    nextDomNode[name] = nextNode.attrs[name];
                }
            }

            if (typeof nextNode.attrs.ref === 'function') {
                nextNode.attrs.ref(nextDomNode);
            }

            for (let i = 0, l = nextNode.childNodes.length; i < l; i++) {
                nextDomNode.appendChild(createElement(nextNode.childNodes[i], document, skipCreation));
            }
        } else {
            nextDomNode = document.createTextNode('');
        }
    } else {
        nextDomNode = document.createTextNode(nextNode.value);
    }

    return nextDomNode;
}

export default Patch;
export {
    Create,
    Move,
    Remove,
    Replace,
    SetRef,
    SplitText,
    Update,
    AttachEvents
};
