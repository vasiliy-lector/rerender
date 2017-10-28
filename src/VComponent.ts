import { VCOMPONENT } from './constants';
import { Component } from './Component';
import { TemplateComponent } from './TemplateComponent';
import { DynamicVNode } from './DynamicVNode';
import { Context, VirtualDom } from './types';

export class VComponent {
    public type: string = VCOMPONENT;
    public childs: VirtualDom[];
    private parent: VirtualDom;

    constructor(
        public render: () => VirtualDom,
        public componentWillReceiveProps: (props: any, additional?: any) => void,
        public componentType: typeof Component,
        public id: string,
        public componentTemplate: TemplateComponent,
        private context: Context,
        public ref: any // FIXME: DynamicVNode
    ) {
        this.parent = context.parent;
    }

    public getParent() {
        return this.parent;
    }

    public setChilds(childs: VirtualDom[]) {
        this.childs = childs;
    }
}
