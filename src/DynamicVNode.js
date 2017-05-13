import { DYNAMIC_VNODE } from './types';
import { UpdateDynamic } from './Patch';

function DynamicVNode(node) {
    this.node = node;
    this.tag = node.tag;
    this.attrs = {};
    this._setListeners();
}

DynamicVNode.prototype = {
    type: DYNAMIC_VNODE,

    set(name, value) {
        if (this.attrs[name] === value) {
            return;
        }
        if (!this.prevAttrs) {
            this.prevAttrs = {};
        }
        if (!this.prevAttrs[name]) {
            this.prevAttrs[name] = this.attrs[name];
        }
        this.attrs[name] = value;
        this._scheduleUpdate();
    },

    get(name) {
        return this.attrs[name];
    },

    reset(name) {
        if (name === undefined) {
            if (Object.keys(this.attrs).length) {
                this.prevAttrs = this.attrs;
                this.attrs = {};
                this._scheduleUpdate();
            }
        } else if (this.attrs[name] !== undefined) {
            if (!this.prevAttrs) {
                this.prevAttrs = {};
            }
            this.prevAttrs[name] = this.attrs[name];
            delete this.attrs[name];
            this._scheduleUpdate();
        }
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
                this.attrs.oninput = this._handleInput;
            } else if (nodeAttrs.type === 'checkbox'){
                this.attrs.onchange = this._handleCheckboxChange;
            }
        }
    },

    _scheduleUpdate() {
        if (!this._timeout) {
            this._timeout = setTimeout(this._update, 0);
        }
    },

    _udpate() {
        delete this._timeout;

        if (this.prevAttrs) {
            (new UpdateDynamic(this.node)).apply();
        }
    },

    _handleInput(event) {
        this.attrs.value = event.target.value;
        const nodeAttrs = this.node.attrs;

        if (nodeAttrs && typeof nodeAttrs.oninput === 'function') {
            nodeAttrs.oninput.apply(null, arguments);
        }
    },

    _handleCheckboxChange(event) {
        this.attrs.checked = event.target.checked;
        const nodeAttrs = this.node.attrs;

        if (nodeAttrs && typeof nodeAttrs.onchange === 'function') {
            nodeAttrs.onchange.apply(null, arguments);
        }
    }
};

export default DynamicVNode;