import { VNODE } from './constants';
import { Map, Context, VirtualDom, VirtualDomNode } from './types';
import { DynamicVNode } from './DynamicVNode';

export class VNode {
    public type: string = VNODE;
    public childs: VirtualDom[];
    public childNodes: VirtualDomNode[];
    private parent: VirtualDom;
    private parentNode: VirtualDomNode;
    private dynamic: DynamicVNode;
    private node: HTMLElement;

    constructor(public tag: string, public attrs: Map<string>, private context: Context) {
        this.parent = context.parent;
        this.parentNode = context.parentNode;
        this.childNodes = [];
        context.getParentNode().appendChild(this);
    }

    setDynamic(dynamic: DynamicVNode) {
        this.dynamic = dynamic;
    }

    setChilds(childs: VirtualDom[]) {
        this.childs = childs;
    }

    appendChild(childNode: VirtualDomNode) {
        this.childNodes.push(childNode);
    }

    getParent() {
        return this.parent;
    }

    getDomNode() {
        return this.node || (this.node = this.context.getDomNode());
    }
}
