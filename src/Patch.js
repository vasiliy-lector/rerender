import { VNODE } from './types';

const CREATE = 'CREATE';
const MOVE = 'MOVE';
const REMOVE = 'REMOVE';
const REPLACE = 'REPLACE';
const UPDATE = 'UPDATE';
const SPLIT_TEXT = 'SPLIT_TEXT';
const SET_REF = 'SET_REF';
const REMOVE_REF = 'REMOVE_REF';
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

            if (command.type !== CREATE && command.type !== REMOVE_REF) {
                domNodes[i] = command.refNode.getDomNode();
                if (command.type === MOVE) {
                    options.skipCreation[command.nextNode.context.id] = true;
                }
            }
        }

        for (let i = 0, l = this.commands.length; i < l; i++) {
            this.commands[i].apply(options, domNodes[i]);
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

const specialAttrs = {
    ref: true,
    uniqid: true,
    key: true
};

function Create(nextNode) {
    this.nextNode = nextNode;
}
Create.prototype = {
    type: CREATE,

    apply(options) {
        const parentDomNode = this.nextNode.parentNode.getDomNode();
        const domNode = parentDomNode.childNodes[this.nextNode.context.domIndex];
        const nextDomNode = createElement(this.nextNode, options.document, options.skipCreation);

        if (domNode) {
            parentDomNode.replaceChild(nextDomNode, domNode);
        } else {
            parentDomNode.appendChild(nextDomNode);
        }
    }
};

function Move(nextNode, node) {
    this.nextNode = nextNode;
    this.node = node;
    this.refNode = node;
}
Move.prototype = {
    type: MOVE,

    apply(options, prevDomNode) {
        const parentDomNode = this.nextNode.parentNode.getDomNode();
        const domNode = parentDomNode.childNodes[this.nextNode.context.domIndex];

        if (!this.nextNode.context.hasKey) {
            prevDomNode.parentNode.replaceChild(document.createTextNode(''), prevDomNode);
        }

        if (domNode) {
            parentDomNode.replaceChild(prevDomNode, domNode);
        } else {
            parentDomNode.appendChild(prevDomNode);
        }
    }
};

function Remove(node) {
    this.node = node;
    this.refNode = node;
}
Remove.prototype = {
    type: REMOVE,

    apply(options, domNode) {
        if (this.node.type === VNODE && typeof this.node.attrs.ref === 'function') {
            this.node.attrs.ref(null);
        }

        if (domNode.parentNode) {
            domNode.parentNode.removeChild(domNode);
        }
    }
};

function RemoveRef(node) {
    this.node = node;
}
RemoveRef.prototype = {
    type: REMOVE_REF,

    apply() {
        this.node.attrs.ref(null);
    }
};

function Replace(nextNode) {
    this.nextNode = nextNode;
    this.refNode = nextNode;
}
Replace.prototype = {
    type: REPLACE,

    apply(options, domNode) {
        const nextDomNode = createElement(this.nextNode, options.document, options.skipCreation);

        domNode.parentNode.replaceChild(
            nextDomNode,
            domNode
        );
    }
};

function SetRef(nextNode) {
    this.nextNode = nextNode;
}
SetRef.prototype = {
    type: SET_REF,

    apply() {
        this.nextNode.attrs.ref(this.nextNode, this.nextNode.getDomNode());
    }
};

function SplitText(nextNode) {
    this.nextNode = nextNode;
}
SplitText.prototype = {
    type: SPLIT_TEXT,

    apply() {
        this.nextNode.getDomNode().splitText(this.nextNode.value.length);
    }
};

function Update(nextNode, node) {
    this.nextNode = nextNode;
    this.node = node;
    this.refNode = nextNode;
}
Update.prototype = {
    type: UPDATE,

    apply(options, domNode) {
        const nextAttrs = this.nextNode.attrs;
        const attrs = this.node.attrs;

        if (nextAttrs) {
            for (let name in nextAttrs) {
                if (nextAttrs[name] !== attrs[name] && !specialAttrs[name]) {
                    domNode[name.substr(0, 2) === 'on' ? name.toLowerCase() : name] = nextAttrs[name];
                }
            }
        }
        if (attrs) {
            for (let name in attrs) {
                if (nextAttrs[name] === undefined) {
                    domNode[name.substr(0, 2) === 'on' ? name.toLowerCase() : name] = null;
                }
            }
        }
    }
};

function AttachEvents(nextNode) {
    this.nextNode = nextNode;
}
AttachEvents.prototype = {
    type: ATTACH_EVENTS,

    apply() {
        const domNode = this.nextNode.getDomNode();
        const nextAttrs = this.nextNode.attrs;

        for (let name in nextAttrs) {
            if (name.substr(0,2) === 'on') {
                domNode[name.toLowerCase()] = nextAttrs[name];
            }
        }
    }
};

function createElement(nextNode, document, skipCreation) {
    let nextDomNode;

    if (nextNode.type === VNODE) {
        if (!skipCreation[nextNode.context.id]) {
            nextDomNode = document.createElement(nextNode.tag);

            for (let name in nextNode.attrs) {
                if (specialAttrs[name]) {
                    continue;
                } else if (name.substr(0, 2) === 'on') {
                    nextDomNode[name.toLowerCase()] = nextNode.attrs[name];
                } else {
                    nextDomNode[name] = nextNode.attrs[name];
                }
            }

            if (typeof nextNode.attrs.ref === 'function') {
                nextNode.attrs.ref(nextNode, nextDomNode);
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
    RemoveRef,
    SplitText,
    Update,
    AttachEvents
};
