import { VirtualDom, VirtualDomNode } from './types';

export type ContextParams = {
    isDomNode?: boolean,
    parentId: string,
    parentNodeId: string,
    index: number,
    parentPosition: string,
    domIndex: number,
    parent?: VirtualDom,
    parentNode?: VirtualDomNode,
    domLevel?: boolean,
    key?: string,
    uniqid?: string,
    relativeParentId?: string,
    relativePosition?: string,
    inheritableKey?: string,
    inheritableUniqid?: string,
    rootNode?: HTMLElement
};

export class Context {
    public parent?: VirtualDom;
    public parentNode?: VirtualDomNode;
    public rootNode?: HTMLElement;

    private parentId: string;
    private parentNodeId: string;
    private index: number;
    private parentPosition: string;
    private domIndex: number;
    private domLevel?: boolean;
    private position?: string;
    private domId?: string;
    private relativePosition?: string;
    private relativeParentId?: string;
    private inheritableUniqid?: string;
    private inheritableKey?: string;
    private id: string;
    private hasKey?: boolean;

    constructor({
        isDomNode,
        parentId,
        parentNodeId,
        index,
        parentPosition,
        domIndex,
        parent,
        parentNode,
        domLevel,
        key,
        uniqid,
        relativeParentId,
        relativePosition,
        inheritableKey,
        inheritableUniqid,
        rootNode
    }: ContextParams) {
        this.parentId = parentId;
        this.parentNodeId = parentNodeId;
        this.index = index;
        this.parentPosition = parentPosition;
        this.domIndex = domIndex;
        this.parent = parent;
        this.parentNode = parentNode;
        this.domLevel = domLevel;
        this.rootNode = rootNode;
        const id = uniqid || `${this.parentId}.${key
            ? `k${key}`
            : (isDomNode
                ? index
                : 'c' + index)}`;

        if (isDomNode) {
            this.position = `${parentPosition || ''}.childNodes[${domIndex}]`;
            if (uniqid || key || inheritableUniqid || inheritableKey) {
                this.relativeParentId = id;
                this.relativePosition = '';
                this.domId = key || inheritableKey || !relativeParentId
                    ? `${parentNodeId}.childNodes[${domIndex}]`
                    : `${relativeParentId}${relativePosition}.childNodes[${domIndex}]`;
                if (key || inheritableKey) {
                    this.hasKey = true;
                }
            } else {
                this.relativeParentId = relativeParentId;
                this.relativePosition = `${relativePosition}.childNodes[${domIndex}]`;
            }
        } else {
            this.inheritableKey = key || inheritableKey;
            this.inheritableUniqid = uniqid || inheritableUniqid;
            this.relativeParentId = relativeParentId;
            this.relativePosition = relativePosition;
        }

        this.id = id;
    }

    public addIdLevel(component?: VirtualDom) {
        return new Context({
            parentId: this.id,
            index: 0,
            parent: component || this.parent,

            // no rewrite
            domLevel: !component && this.domLevel,
            parentNodeId: this.parentNodeId,
            parentPosition: this.position || this.parentPosition,
            domIndex: this.domIndex,
            parentNode: this.parentNode,
            relativeParentId: this.relativeParentId,
            relativePosition: this.relativePosition,
            inheritableKey: this.inheritableKey,
            inheritableUniqid: this.inheritableUniqid,
            rootNode: this.rootNode
        });
    }

    public addDomLevel(node: VirtualDom, id: string) {
        return new Context({
            domLevel: true,
            parentId: this.id,
            index: 0,
            parentPosition: this.position || this.parentPosition,
            domIndex: 0,
            parent: node,
            parentNode: node,
            parentNodeId: id,

            // no rewrite
            relativeParentId: this.relativeParentId,
            relativePosition: this.relativePosition,
            inheritableKey: this.inheritableKey,
            inheritableUniqid: this.inheritableUniqid,
            rootNode: this.rootNode
        });
    }

    public incrementComponent(key?: string, uniqid?: string) {
        return new Context({
            index: (key || uniqid) ? this.index : this.index++,
            domIndex: this.domLevel ? this.domIndex++ : this.domIndex,
            key,
            uniqid,

            // no rewrite
            domLevel: this.domLevel,
            parentId: this.parentId,
            parentNodeId: this.parentNodeId,
            parentPosition: this.parentPosition,
            parent: this.parent,
            parentNode: this.parentNode,
            relativeParentId: this.relativeParentId,
            relativePosition: this.relativePosition,
            inheritableKey: this.inheritableKey,
            inheritableUniqid: this.inheritableUniqid,
            rootNode: this.rootNode
        });
    }

    public incrementDom(key?: string, uniqid?: string) {
        return new Context({
            isDomNode: true,
            index: (key || uniqid) ? this.index : this.index++,
            domIndex: this.domIndex++,
            key,
            uniqid,

            // no rewrite
            domLevel: this.domLevel,
            parentId: this.parentId,
            parentNodeId: this.parentNodeId,
            parentPosition: this.parentPosition,
            parent: this.parent,
            parentNode: this.parentNode,
            relativeParentId: this.relativeParentId,
            relativePosition: this.relativePosition,
            inheritableKey: this.inheritableKey,
            inheritableUniqid: this.inheritableUniqid,
            rootNode: this.rootNode
        });
    }

    public getId() {
        return this.id;
    }

    public getDomNode() {
        return (new Function('rootNode', `return rootNode${this.position}`))(this.rootNode);
    }

    public getDomId() {
        return this.domId;
    }

    public getParent() {
        return this.parent;
    }

    public getParentNode() {
        return this.parentNode;
    }
}
