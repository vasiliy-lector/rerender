import { TemplateVNode } from './TemplateVNode';
import { TemplateComponent } from './TemplateComponent';
import { TemplateFragment } from './TemplateFragment';
import { TemplateComponentStateless } from './TemplateComponentStateless';
import { Component } from './Component';
import { Controllers } from './Controllers';
import { ElementType, Template, TemplateProps, StatelessComponent } from './types';

export function createTemplate(componentType: any, props: TemplateProps): Template {
    const length = arguments.length;
    let children = null;

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
    } else if (componentType.controller !== undefined) {
        return new TemplateComponent(
            Controllers,
            props,
            createTemplateFragment(children),
            componentType as Component<typeof props, any>
        );
    } else if (componentType.prototype instanceof Component) {
        return new TemplateComponent(
            componentType as Component<typeof props, any>,
            props,
            createTemplateFragment(children)
        );
    } else {
        return new TemplateComponentStateless(
            componentType as StatelessComponent<typeof props>,
            props,
            createTemplateFragment(children)
        );
    }
}

function createTemplateFragment(fragment: any) {
    return fragment == null || fragment instanceof TemplateFragment
        ? fragment
        : new TemplateFragment(fragment);
}
