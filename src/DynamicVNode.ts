import { DYNAMIC_VNODE } from './constants';
import { UpdateDynamic } from './Patch';
import { VirtualDomNode, Map, Attrs, AttrsValue } from './types';

export class DynamicVNode {
    public type: string = DYNAMIC_VNODE;
    private tag: string;
    private attrs: Attrs;
    private prevAttrs?: Attrs;
    private timeout: number;

    constructor(private node: VirtualDomNode) {
        this.tag = node.tag;
        this.attrs = {};
        this.setListeners();
    }

    public set(name: string, value: AttrsValue): void {
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
        this.scheduleUpdate();
    }

    public get(name: string) {
        return this.attrs[name] !== undefined
            ? this.attrs[name]
            : this.node.attrs && this.node.attrs[name];
    }

    public reset(name: string) {
        if (name === undefined) {
            if (Object.keys(this.attrs).length) {
                for (const key in this.attrs) {
                    if (key.substr(0, 2) !== 'on') {
                        (this.prevAttrs || (this.prevAttrs = {}))[key] = this.attrs[key];
                        this.attrs[key] = null;
                    }
                }
                this.scheduleUpdate();
            }
        } else if (this.attrs[name] !== undefined) {
            if (!this.prevAttrs) {
                this.prevAttrs = {};
            }
            this.prevAttrs[name] = this.attrs[name];
            delete this.attrs[name];
            this.scheduleUpdate();
        }
    }

    public getNode() {
        return this.node;
    }

    public getDomNode() {
        return this.node.getDomNode();
    }

    private setListeners() {
        const nodeAttrs = this.node.attrs;

        // TODO: textarea, radio, select, contenteditable
        if (this.tag === 'input') {
            if (!nodeAttrs || (!nodeAttrs.type || nodeAttrs.type === 'text')) {
                this.attrs.oninput = this.handleInput.bind(this);
            } else if (nodeAttrs.type === 'checkbox') {
                this.attrs.onchange = this.handleCheckboxChange.bind(this);
            }
        }
    }

    private scheduleUpdate() {
        if (!this.timeout) {
            this.timeout = setTimeout(() => this.update(), 0);
        }
    }

    private update() {
        delete this.timeout;

        if (this.prevAttrs) {
            (new UpdateDynamic(this.node)).apply();
        }
    }

    private handleInput(event: Event) {
        this.attrs.value = (event.target as HTMLInputElement).value;
        const nodeAttrs = this.node.attrs;

        if (nodeAttrs && typeof nodeAttrs.oninput === 'function') {
            nodeAttrs.oninput.apply(null, arguments);
        }
    }

    private handleCheckboxChange(event: Event) {
        this.attrs.checked = (event.target as HTMLInputElement).checked;
        const nodeAttrs = this.node.attrs;

        if (nodeAttrs && typeof nodeAttrs.onchange === 'function') {
            nodeAttrs.onchange.apply(null, arguments);
        }
    }
}
