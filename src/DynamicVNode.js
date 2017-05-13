import { DYNAMIC_VNODE } from './types';

function DynamicVNode(node) {
    this.node = node;
    this.tag = node.tag;
    this.attrs = {};
    this._setListeners();
}

DynamicVNode.prototype = {
    type: DYNAMIC_VNODE,

    set(name, value) {
        this.attrs[name] = value;
        this._update(name);
    },

    get(name) {
        return this.attrs[name];
    },

    reset(name) {
        if (name === undefined) {
            this.attrs = {};
        } else {
            delete this.attrs[name];
        }
        this._update(name);
    },

    getNode() {
        return this.node;
    },

    getDomNode() {
        return this.node.getDomNode();
    },

    _replaceNode(node) {
        this.node = node;
        this._setListeners();
    },

    _setListeners() {
        const nodeAttrs = this.node.attrs;

        // TODO: textarea, radio, select, contenteditable
        if (this.tag === 'input') {
            if (!nodeAttrs || (!nodeAttrs.type || nodeAttrs.type === 'text')) {
                this.attrs.onInput = this._handleInput;
            } else if (nodeAttrs.type === 'checkbox'){
                this.attrs.onChange = this._handleCheckboxChange;
            }
        }
    },

    _update(name) {
        // FIXME: how?
    },

    _handleInput(event) {
        this.attrs.value = event.target.value;
        const nodeAttrs = this.node.attrs;

        if (nodeAttrs) {
            if (typeof nodeAttrs.onInput === 'function') {
                nodeAttrs.onInput.apply(null, arguments);
            } else if (typeof nodeAttrs.oninput === 'function') {
                nodeAttrs.oninput.apply(null, arguments);
            }
        }
    },

    _handleCheckboxChange(event) {
        this.attrs.checked = event.target.checked;
        const nodeAttrs = this.node.attrs;

        if (nodeAttrs) {
            if (typeof nodeAttrs.onChange === 'function') {
                nodeAttrs.onChange.apply(null, arguments);
            } else if (typeof nodeAttrs.onchange === 'function') {
                nodeAttrs.onchange.apply(null, arguments);
            }
        }
    }
};

export default DynamicVNode;
