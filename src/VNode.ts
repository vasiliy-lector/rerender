import { VNODE } from './constants';
import { Context } from './Context';
import { Map, VirtualDom, VirtualDomNode } from './types';
import { DynamicVNode } from './DynamicVNode';

export class VNode {
    public type: string = VNODE;
    public childs: VirtualDom[];
    public childNodes: VirtualDomNode[];
    public dynamic: DynamicVNode;
    private parent: VirtualDom;
    private parentNode: VirtualDomNode;
    private node: HTMLElement;

    constructor(public tag: string, public attrs: Map<string>, private context: Context) {
        this.parent = context.parent;
        this.parentNode = context.parentNode;
        this.childNodes = [];
        context.getParentNode().appendChild(this);
    }

    public setDynamic(dynamic: DynamicVNode) {
        this.dynamic = dynamic;
    }

    public setChilds(childs: VirtualDom[]) {
        this.childs = childs;
    }

    public appendChild(childNode: VirtualDomNode) {
        this.childNodes.push(childNode);
    }

    public getParent() {
        return this.parent;
    }

    public getDomNode() {
        return this.node || (this.node = this.context.getDomNode());
    }
}
