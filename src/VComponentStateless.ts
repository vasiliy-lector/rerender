import { VCOMPONENT_STATELESS } from './constants';
import { Component } from './Component';
import { Context } from './Context';
import { TemplateComponentStateless } from './TemplateComponentStateless';
import { StatelessComponent, VirtualDom } from './types';

export class VComponentStateless {
    public type: string = VCOMPONENT_STATELESS;
    public childs: VirtualDom[];
    private parent: VirtualDom;

    constructor(
        public render: () => VirtualDom,
        public componentType: StatelessComponent<any, any>,
        public id: string,
        public template: VirtualDom, // FIXME: проверить
        public componentTemplate: TemplateComponentStateless<any, any>,
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
