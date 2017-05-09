import { debug } from './debug';
import { createTag, createText } from './createElement';
import { VNODE } from './types';

const CREATE = 'CREATE';
const MOVE = 'MOVE';
const REMOVE = 'REMOVE';
const REPLACE = 'REPLACE';
const UPDATE = 'UPDATE';
const SPLIT_TEXT = 'SPLIT_TEXT';
const SET_REF = 'SET_REF';
const ATTACH_EVENTS = 'ATTACH_EVENTS';

function Patch () {
    this.commands = [];
    this.setRefCommands = [];
    this.splitTextCommands = [];
    this.eventsCommands = [];
}

Patch.prototype = {
    apply(rootNode, document) {
        const domNodes = [];

        for (let i = 0, l = this.commands.length; i < l; i++) {
            if (this.commands[i].type !== CREATE) {
                domNodes[i] = this.commands[i].getNode(rootNode);
            }
        }

        for (let i = 0, l = this.commands.length; i < l; i++) {
            this.commands[i].apply(rootNode, document, domNodes[i]);
        }
    },

    applyNormalize(rootNode, document) {
        for (let i = 0, l = this.splitTextCommands.length; i < l; i++) {
            this.splitTextCommands[i].apply(rootNode, document);
        }

        for (let i = 0, l = this.setRefCommands.length; i < l; i++) {
            this.setRefCommands[i].apply(rootNode, document);
        }

        for (let i = 0, l = this.eventsCommands.length; i < l; i++) {
            this.eventsCommands[i].apply(rootNode, document);
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
    apply() {}
};

function Move(nextNode, node) {
    this.nextNode = nextNode;
    this.node = node;
}
Move.prototype = {
    apply() {},

    getNode(rootNode) {
        return this.node.context.getNode(rootNode);
    }
};

function Remove(node) {
    this.node = node;
}
Remove.prototype = {
    apply() {},

    getNode(rootNode) {
        return this.node.context.getNode(rootNode);
    }
};

function Replace(nextNode) {
    this.nextNode = nextNode;
}
Replace.prototype = {
    apply() {},

    getNode(rootNode) {
        return this.nextNode.context.getNode(rootNode);
    }
};

function SetRef(nextNode) {
    this.nextNode = nextNode;
}
SetRef.prototype = {
    apply() {},

    getNode(rootNode) {
        return this.nextNode.context.getNode(rootNode);
    }
};

function SplitText(nextNode) {
    this.nextNode = nextNode;
}
SplitText.prototype = {
    apply() {},

    getNode(rootNode) {
        return this.nextNode.context.getNode(rootNode);
    }
};

function Update(nextNode, node) {
    this.nextNode = nextNode;
    this.node = node;
}
Update.prototype = {
    apply() {},

    getNode(rootNode) {
        return this.nextNode.context.getNode(rootNode);
    }
};

function AttachEvents(nextNode) {
    this.nextNode = nextNode;
}
AttachEvents.prototype = {
    apply() {},

    getNode(rootNode) {
        return this.nextNode.context.getNode(rootNode);
    }
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
