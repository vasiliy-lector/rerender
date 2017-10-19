import { TemplateVNode } from './TemplateVNode';
import { TemplateComponent } from './TemplateComponent';
import { TemplateFragment } from './TemplateFragment';
import { TemplateComponentStateless } from './TemplateComponentStateless';
import { Component } from './Component';

export type Template = any; // FIXME: TemplateVNode | TemplateComponent | TemplateComponentStateless;
export type StatelessComponent = (props: PropsType) => Node;
export type ElementType = string | typeof Component | StatelessComponent;

export type ConfigServer = any; // FIXME
export type ConfigClient = any; // FIXME

export type VirtualDom = any; // FIXME
export type VirtualDomNode = any; // FIXME
export type Context = any; // FIXME

export type AttrsValue = any;
export type Attrs = Map<AttrsValue>;

export interface TemplateBase {
    renderServer: (config: ConfigServer) => Promise<void> | void;
    renderClientServerLike: (config: ConfigClient, context: Context) => Promise<VirtualDom> | VirtualDom;
    renderClient: (config: ConfigClient, context: Context) => VirtualDom;
}

export type PropsType = Map<any> | null | void;

export interface Map<T> {
    [key: string]: T;
}

export type Node = any; // FIXME
