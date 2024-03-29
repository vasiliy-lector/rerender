import { VNODE } from './constants';
import { noRenderAttrs } from './constants';

const CREATE = 'CREATE';
const MOVE = 'MOVE';
const REMOVE = 'REMOVE';
const REPLACE = 'REPLACE';
const UPDATE = 'UPDATE';
const UPDATE_DYNAMIC = 'UPDATE_DYNAMIC';
const SPLIT_TEXT = 'SPLIT_TEXT';
const SET_REF = 'SET_REF';
const REMOVE_REF = 'REMOVE_REF';
const ATTACH_EVENTS = 'ATTACH_EVENTS';
const catchEvent = function(event) {
    event.stopPropagation();
};

export class Patch {
    constructor(document = self.document) {
        this.document = document;
        this.commands = [];
        this.setRefCommands = [];
        this.splitTextCommands = [];
        this.eventsCommands = [];
    }

    apply() {
        const domNodes = [];
        const document = this.document;
        const options = {
            document,
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

        const prevActiveElement = document.activeElement;
        const body = document.body;
        let prevOnblur;

        if (prevActiveElement && prevActiveElement !== body) {
            prevOnblur = prevActiveElement.onblur;
            prevActiveElement.onblur = catchEvent;
        }

        for (let i = 0, l = this.commands.length; i < l; i++) {
            this.commands[i].apply(options, domNodes[i]);
        }

        const activeElement = document.activeElement;

        if (prevActiveElement && prevActiveElement !== body) {
            if (prevActiveElement.onblur === catchEvent) {
                prevActiveElement.onblur = prevOnblur;
            }
            if ((!activeElement || activeElement === document.body) && prevActiveElement.parentNode) {
                const prevOnfocus = prevActiveElement.onfocus;
                prevActiveElement.onfocus = catchEvent;
                prevActiveElement.focus();
                prevActiveElement.onfocus = prevOnfocus;
            }
        }
    }

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
    }

    push(command) {
        this.commands.push(command);
    }

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

}

export class Create {
    type = CREATE;

    constructor(nextNode) {
        this.nextNode = nextNode;
    }

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
}

export class Move {
    type = MOVE;

    constructor(nextNode, node) {
        this.nextNode = nextNode;
        this.node = node;
        this.refNode = node;
    }

    apply(options, prevDomNode) {
        const parentDomNode = this.nextNode.parentNode.getDomNode();
        const domNode = parentDomNode.childNodes[this.nextNode.context.domIndex];

        if (!this.nextNode.context.hasKey && prevDomNode.parentNode) {
            prevDomNode.parentNode.replaceChild(document.createTextNode(''), prevDomNode);
        }

        if (domNode) {
            parentDomNode.replaceChild(prevDomNode, domNode);
        } else {
            parentDomNode.appendChild(prevDomNode);
        }
    }
}

export class Remove {
    type = REMOVE;

    constructor(node) {
        this.node = node;
        this.refNode = node;
    }

    apply(options, domNode) {
        if (this.node.type === VNODE && this.node.attrs && typeof this.node.attrs.ref === 'function') {
            this.node.attrs.ref(null);
        }

        if (domNode.parentNode) {
            domNode.parentNode.removeChild(domNode);
        }
    }
}

export class RemoveRef {
    type = REMOVE_REF;

    constructor(node) {
        this.node = node;
    }

    apply() {
        this.node.attrs.ref(null);
    }
}

export class Replace {
    type = REPLACE;

    constructor(nextNode) {
        this.nextNode = nextNode;
        this.refNode = nextNode;
    }

    apply(options, domNode) {
        const nextDomNode = createElement(this.nextNode, options.document, options.skipCreation);

        domNode.parentNode.replaceChild(
            nextDomNode,
            domNode
        );
    }
}

export class SetRef {
    type = SET_REF;

    constructor(nextNode) {
        this.nextNode = nextNode;
    }

    apply() {
        this.nextNode.attrs.ref(this.nextNode.dynamic);
    }
}

export class SplitText {
    type = SPLIT_TEXT;

    constructor(nextNode) {
        this.nextNode = nextNode;
    }

    apply() {
        this.nextNode.getDomNode().splitText(this.nextNode.value.length);
    }
}

export class Update {
    type = UPDATE;

    constructor(nextNode, node) {
        this.nextNode = nextNode;
        this.node = node;
        this.refNode = nextNode;
    }

    apply(options, domNode) {
        if (this.nextNode.dynamic && this.nextNode.dynamic.prevAttrs) {
            this.applyDynamic(options, domNode);
        } else {
            const nextAttrs = this.nextNode.attrs;
            const attrs = this.node.attrs;

            if (nextAttrs) {
                for (let name in nextAttrs) {
                    if ((!attrs || nextAttrs[name] !== attrs[name]) && !noRenderAttrs[name]) {
                        domNode[name] = nextAttrs[name];
                    }
                }
            }
            if (attrs) {
                for (let name in attrs) {
                    if (!nextAttrs || nextAttrs[name] === undefined) {
                        domNode[name] = null;
                    }
                }
            }
        }
    }

    applyDynamic(options, domNode) {
        const nextAttrsDynamic = this.nextNode.dynamic.attrs;
        const attrsDynamic = this.nextNode.dynamic.prevAttrs;
        const nextAttrs = this.nextNode.attrs;
        const attrs = this.node.attrs;

        for (let name in nextAttrsDynamic) {
            if (nextAttrsDynamic[name] !== attrsDynamic[name]) {
                domNode[name] = nextAttrsDynamic[name];
            }
        }

        for (let name in attrsDynamic) {
            if (!nextAttrsDynamic[name]) {
                domNode[name] = nextAttrs && nextAttrs[name] || null;
            }
        }

        if (nextAttrs) {
            for (let name in nextAttrs) {
                if (nextAttrsDynamic[name] === undefined && (!attrs || nextAttrs[name] !== attrs[name]) && !noRenderAttrs[name]) {
                    domNode[name] = nextAttrs[name];
                }
            }
        }
        if (attrs) {
            for (let name in attrs) {
                if (!nextAttrsDynamic[name] && !attrsDynamic[name] && (!nextAttrs || nextAttrs[name] === undefined)) {
                    domNode[name] = null;
                }
            }
        }

        delete this.node.dynamic.prevAttrs;
    }
}

export class UpdateDynamic {
    type = UPDATE_DYNAMIC;

    constructor(node) {
        this.node = node;
    }

    apply() {
        const prevAttrs = this.node.dynamic.prevAttrs;
        const attrs = this.node.dynamic.attrs;
        const domNode = this.node.getDomNode();

        if (prevAttrs) {
            for (let name in attrs) {
                if (attrs[name] !== prevAttrs[name]) {
                    domNode[name] = attrs[name];
                }
            }

            for (let name in prevAttrs) {
                if (attrs[name] === undefined) {
                    domNode[name] = this.node.attrs && this.node.attrs[name] || null;
                }
            }

            this.node.dynamic._setUpdated();
        }
    }
}

// TODO: rename AttachEventsAndDynamic
export class AttachEvents {
    type = ATTACH_EVENTS;

    constructor(nextNode) {
        this.nextNode = nextNode;
    }

    apply() {
        const domNode = this.nextNode.getDomNode();
        const nextAttrs = this.nextNode.attrs;

        if (this.nextNode.dynamic) {
            this.applyDynamic();
        } else {
            for (let name in nextAttrs) {
                if (name.substr(0,2) === 'on') {
                    domNode[name] = nextAttrs[name];
                }
            }
        }
    }

    applyDynamic() {
        const domNode = this.nextNode.getDomNode();
        const nextAttrs = this.nextNode.attrs;
        const dynamicAttrs = this.nextNode.dynamic.attrs;

        for (let name in dynamicAttrs) {
            domNode[name] = dynamicAttrs[name];
        }

        for (let name in nextAttrs) {
            if (name.substr(0,2) === 'on' && dynamicAttrs[name] === undefined) {
                domNode[name] = nextAttrs[name];
            }
        }
    }
}

function createElement(nextNode, document, skipCreation) {
    let nextDomNode;

    if (nextNode.type === VNODE) {
        if (!skipCreation[nextNode.context.id]) {
            nextDomNode = document.createElement(nextNode.tag);

            if (nextNode.dynamic) {
                for (let name in nextNode.dynamic.attrs) {
                    nextDomNode[name] = nextNode.dynamic.attrs[name];
                }

                if (nextNode.attrs) {
                    for (let name in nextNode.attrs) {
                        if (!noRenderAttrs[name] && nextNode.dynamic.attrs[name] === undefined) {
                            nextDomNode[name] = nextNode.attrs[name];
                        }
                    }

                    if (typeof nextNode.attrs.ref === 'function') {
                        nextNode.attrs.ref(nextNode.dynamic);
                    }
                }
            } else if (nextNode.attrs) {
                for (let name in nextNode.attrs) {
                    if (!noRenderAttrs[name]) {
                        nextDomNode[name] = nextNode.attrs[name];
                    }
                }

                if (typeof nextNode.attrs.ref === 'function') {
                    nextNode.attrs.ref(nextNode.dynamic);
                }
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
