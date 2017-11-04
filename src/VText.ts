import { VTEXT } from './constants';
import { Context } from './Context';
import { VirtualDom, VirtualDomNode } from './types';

export class VText {
    public type: string = VTEXT;
    private node: HTMLElement;
    private parent: VirtualDom;
    private parentNode: VirtualDomNode;

    constructor(public value: string, private context: Context) {
        this.parent = context.getParent();
        this.parentNode = context.getParentNode();
        context.getParentNode().appendChild(this);
    }

    public getDomNode() {
        return this.node || (this.node = this.context.getDomNode());
    }
}
