import { TemplateVNode } from './TemplateVNode';
import { TemplateComponent } from './TemplateComponent';
import { TemplateFragment } from './TemplateFragment';
import { TemplateComponentStateless } from './TemplateComponentStateless';
import { Component } from './Component';
import { Controllers } from './Controllers';
import {
    ElementType,
    Map,
    RawProps,
    Renderable,
    ComponentType,
    StatelessComponent,
    Template,
    TemplateChildren
} from './types';

type CreateTemplate = <Props extends Map<any> = Map<any>, Children extends Renderable = Renderable>
    (componentType: ElementType, props: Props | null, ...children: Children[])
        => any;
        // FIXME: must be => Template;

export const createTemplate: CreateTemplate = function(componentType, props) {
    const length = arguments.length;
    let children: TemplateChildren = null;

    if (length > 2 && (arguments[2] || length !== 3)) {
        children = Array(length - 2);

        for (let i = 2; i < length; i++) {
            children[i - 2] = arguments[i];
        }
    }

    if (props && props.controller) {
        return new TemplateComponent(Controllers, props, createTemplateFragment(children), componentType);
    } else if (typeof componentType === 'string') {
        return new TemplateVNode(
            componentType as string,
            props,
            children
        );
    } else if (componentType.prototype instanceof Component) {
        return new TemplateComponent(
            componentType as ComponentType<any>,
            props,
            createTemplateFragment(children)
        );
    } else {
        return new TemplateComponentStateless(
            componentType as StatelessComponent<any, any>,
            props,
            createTemplateFragment(children)
        );
    }
};

function createTemplateFragment(fragment: any) {
    return fragment == null || fragment instanceof TemplateFragment
        ? fragment
        : new TemplateFragment(fragment);
}
