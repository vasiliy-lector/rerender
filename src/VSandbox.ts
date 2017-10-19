import { VSANDBOX } from './constants';
import { VirtualDom, VirtualDomNode } from './types';

export class VSandbox {
    public type: string = VSANDBOX;
    public childs: VirtualDom[];
    public childNodes: VirtualDomNode[];

    private parent: VirtualDom | null;
    private parentNode: VirtualDomNode | null;

    constructor(private domNode: VirtualDomNode) {
        this.parent = null;
        this.parentNode = null;
        this.childNodes = [];
    }

    public setChilds(childs: VirtualDom[]) {
        this.childs = childs;
    }

    public appendChild(childNode: VirtualDomNode[]) {
        this.childNodes.push(childNode);
    }

    public getParent() {
        return this.parent;
    }

    public getDomNode() {
        return this.domNode;
    }
}
