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

        for (let i = 0, l = this.commands.length; i < l; i++) {
            if (this.commands[i].type !== CREATE) {
                domNodes[i] = this.commands[i].refNode.getDomNode();
            }
        }

        for (let i = 0, l = this.commands.length; i < l; i++) {
            this.commands[i].apply(document, domNodes[i]);
        }
    },

    applyNormalize() {
        for (let i = 0, l = this.splitTextCommands.length; i < l; i++) {
            this.splitTextCommands[i].apply(document);
        }

        for (let i = 0, l = this.setRefCommands.length; i < l; i++) {
            this.setRefCommands[i].apply(document);
        }

        for (let i = 0, l = this.eventsCommands.length; i < l; i++) {
            this.eventsCommands[i].apply(document);
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

    apply() {}
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

    apply() {}
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
