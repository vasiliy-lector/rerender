import { TemplateVNode } from './TemplateVNode';
import { TemplateComponent } from './TemplateComponent';
import { TemplateFragment } from './TemplateFragment';
import { TemplateComponentStateless } from './TemplateComponentStateless';
import { Component } from './Component';

export type Template = any; // TemplateVNode | TemplateComponent | TemplateComponentStateless;
export type StatelessComponent<Props> = (props: Props) => any;
export type Widget<Props> = Component<Props, any> | StatelessComponent<Props>;
export type ElementType = string | Widget<any>;

export interface TemplateBase {
    // FIXME: any
    renderServer: (config: any) => Promise<void> | void;
    renderClientServerLike: (config: any) => Promise<void> | void;
    renderClient: (config: any) => any;
}

export type TemplateProps = Map<any> | null | void;

export interface Map<T> {
    [key: string]: T;
}
