import { VNODE } from './types';
import { specialAttrs } from './constants';

var CREATE = 'CREATE';
var MOVE = 'MOVE';
var REMOVE = 'REMOVE';
var REPLACE = 'REPLACE';
var UPDATE = 'UPDATE';
var UPDATE_DYNAMIC = 'UPDATE_DYNAMIC';
var SPLIT_TEXT = 'SPLIT_TEXT';
var SET_REF = 'SET_REF';
var REMOVE_REF = 'REMOVE_REF';
var ATTACH_EVENTS = 'ATTACH_EVENTS';
var catchEvent = function(event) {
    event.stopPropagation();
};

function Patch (document = self.document) {
    this.document = document;
    this.commands = [];
    this.setRefCommands = [];
    this.splitTextCommands = [];
    this.eventsCommands = [];
}

Patch.prototype = {
    apply() {
        var domNodes = [];
        var document = this.document;
        var options = {
            document,
            skipCreation: {}
        };

        for (var i = 0, l = this.commands.length; i < l; i++) {
            var command = this.commands[i];

            if (command.type !== CREATE && command.type !== REMOVE_REF) {
                domNodes[i] = command.refNode.getDomNode();
                if (command.type === MOVE) {
                    options.skipCreation[command.nextNode.context.id] = true;
                }
            }
        }

        var prevActiveElement = document.activeElement;
        var body = document.body;
        var prevOnblur;

        if (prevActiveElement && prevActiveElement !== body) {
            prevOnblur = prevActiveElement.onblur;
            prevActiveElement.onblur = catchEvent;
        }

        for (var i = 0, l = this.commands.length; i < l; i++) {
            this.commands[i].apply(options, domNodes[i]);
        }

        var activeElement = document.activeElement;

        if (prevActiveElement && prevActiveElement !== body) {
            if (prevActiveElement.onblur === catchEvent) {
                prevActiveElement.onblur = prevOnblur;
            }
            if ((!activeElement || activeElement === document.body) && prevActiveElement.parentNode) {
                var prevOnfocus = prevActiveElement.onfocus;
                prevActiveElement.onfocus = catchEvent;
                prevActiveElement.focus();
                prevActiveElement.onfocus = prevOnfocus;
            }
        }
    },

    applyNormalize() {
        for (var i = 0, l = this.splitTextCommands.length; i < l; i++) {
            this.splitTextCommands[i].apply();
        }

        for (var i = 0, l = this.setRefCommands.length; i < l; i++) {
            this.setRefCommands[i].apply();
        }

        for (var i = 0, l = this.eventsCommands.length; i < l; i++) {
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

    apply(options) {
        var parentDomNode = this.nextNode.parentNode.getDomNode();
        var domNode = parentDomNode.childNodes[this.nextNode.context.domIndex];
        var nextDomNode = createElement(this.nextNode, options.document, options.skipCreation);

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
        var parentDomNode = this.nextNode.parentNode.getDomNode();
        var domNode = parentDomNode.childNodes[this.nextNode.context.domIndex];

        if (!this.nextNode.context.hasKey && prevDomNode.parentNode) {
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
        if (this.node.type === VNODE && this.node.attrs && typeof this.node.attrs.ref === 'function') {
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
        var nextDomNode = createElement(this.nextNode, options.document, options.skipCreation);

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
        this.nextNode.attrs.ref(this.nextNode.dynamic);
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
        if (this.nextNode.dynamic && this.nextNode.dynamic.prevAttrs) {
            this.applyDynamic(options, domNode);
        } else {
            var nextAttrs = this.nextNode.attrs;
            var attrs = this.node.attrs;

            if (nextAttrs) {
                for (var name in nextAttrs) {
                    if ((!attrs || nextAttrs[name] !== attrs[name]) && !specialAttrs[name]) {
                        domNode[name] = nextAttrs[name];
                    }
                }
            }
            if (attrs) {
                for (var name in attrs) {
                    if (!nextAttrs || nextAttrs[name] === undefined) {
                        domNode[name] = null;
                    }
                }
            }
        }
    },

    applyDynamic(options, domNode) {
        var nextAttrsDynamic = this.nextNode.dynamic.attrs;
        var attrsDynamic = this.nextNode.dynamic.prevAttrs;
        var nextAttrs = this.nextNode.attrs;
        var attrs = this.node.attrs;

        for (var name in nextAttrsDynamic) {
            if (nextAttrsDynamic[name] !== attrsDynamic[name]) {
                domNode[name] = nextAttrsDynamic[name];
            }
        }

        for (var name in attrsDynamic) {
            if (!nextAttrsDynamic[name]) {
                domNode[name] = nextAttrs && nextAttrs[name] || null;
            }
        }

        if (nextAttrs) {
            for (var name in nextAttrs) {
                if (nextAttrsDynamic[name] === undefined && (!attrs || nextAttrs[name] !== attrs[name]) && !specialAttrs[name]) {
                    domNode[name] = nextAttrs[name];
                }
            }
        }
        if (attrs) {
            for (var name in attrs) {
                if (!nextAttrsDynamic[name] && !attrsDynamic[name] && (!nextAttrs || nextAttrs[name] === undefined)) {
                    domNode[name] = null;
                }
            }
        }

        delete this.node.dynamic.prevAttrs;
    }
};

function UpdateDynamic(node) {
    this.node = node;
}
UpdateDynamic.prototype = {
    type: UPDATE_DYNAMIC,

    apply() {
        var prevAttrs = this.node.dynamic.prevAttrs;
        var attrs = this.node.dynamic.attrs;
        var domNode = this.node.getDomNode();

        if (prevAttrs) {
            for (var name in attrs) {
                if (attrs[name] !== prevAttrs[name]) {
                    domNode[name] = attrs[name];
                }
            }

            for (var name in prevAttrs) {
                if (attrs[name] === undefined) {
                    domNode[name] = this.node.attrs && this.node.attrs[name] || null;
                }
            }

            this.node.dynamic._setUpdated();
        }
    }
};
// TODO: rename AttachEventsAndDynamic
function AttachEvents(nextNode) {
    this.nextNode = nextNode;
}
AttachEvents.prototype = {
    type: ATTACH_EVENTS,

    apply() {
        var domNode = this.nextNode.getDomNode();
        var nextAttrs = this.nextNode.attrs;

        if (this.nextNode.dynamic) {
            this.applyDynamic();
        } else {
            for (var name in nextAttrs) {
                if (name.substr(0,2) === 'on') {
                    domNode[name] = nextAttrs[name];
                }
            }
        }
    },

    applyDynamic() {
        var domNode = this.nextNode.getDomNode();
        var nextAttrs = this.nextNode.attrs;
        var dynamicAttrs = this.nextNode.dynamic.attrs;

        for (var name in dynamicAttrs) {
            domNode[name] = dynamicAttrs[name];
        }

        for (var name in nextAttrs) {
            if (name.substr(0,2) === 'on' && dynamicAttrs[name] === undefined) {
                domNode[name] = nextAttrs[name];
            }
        }
    }
};

function createElement(nextNode, document, skipCreation) {
    var nextDomNode;

    if (nextNode.type === VNODE) {
        if (!skipCreation[nextNode.context.id]) {
            nextDomNode = document.createElement(nextNode.tag);

            if (nextNode.dynamic) {
                for (var name in nextNode.dynamic.attrs) {
                    nextDomNode[name] = nextNode.dynamic.attrs[name];
                }

                if (nextNode.attrs) {
                    for (var name in nextNode.attrs) {
                        if (!specialAttrs[name] && nextNode.dynamic.attrs[name] === undefined) {
                            nextDomNode[name] = nextNode.attrs[name];
                        }
                    }

                    if (typeof nextNode.attrs.ref === 'function') {
                        nextNode.attrs.ref(nextNode.dynamic);
                    }
                }
            } else if (nextNode.attrs) {
                for (var name in nextNode.attrs) {
                    if (!specialAttrs[name]) {
                        nextDomNode[name] = nextNode.attrs[name];
                    }
                }

                if (typeof nextNode.attrs.ref === 'function') {
                    nextNode.attrs.ref(nextNode.dynamic);
                }
            }

            for (var i = 0, l = nextNode.childNodes.length; i < l; i++) {
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
