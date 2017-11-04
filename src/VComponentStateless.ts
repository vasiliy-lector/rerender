import { VCOMPONENT_STATELESS } from './constants';
import { Component } from './Component';
import { Context } from './Context';
import { TemplateComponent } from './TemplateComponent';
import { VirtualDom } from './types';

export class VComponentStateless {
    public type: string = VCOMPONENT_STATELESS;
    public childs: VirtualDom[];
    private parent: VirtualDom;

    constructor(
        public render: () => VirtualDom,
        public componentType: typeof Component,
        public id: string,
        public template: VirtualDom, // FIXME: проверить
        public componentTemplate: TemplateComponent,
        private context: Context
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
