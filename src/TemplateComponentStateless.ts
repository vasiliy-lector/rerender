import { TEMPLATE, TEMPLATE_COMPONENT_STATELESS, TEMPLATE_VNODE, VCOMPONENT_STATELESS } from './constants';
import { Context } from './Context';
import { stringifyChildrenItem } from './TemplateVNode';
import { VComponentStateless } from './VComponentStateless';
import { memoize } from './utils';
import { VText } from './VText';

import {
    Map,
    RawProps,
    ElementType,
    TemplateBase,
    ConfigServer,
    StatelessComponent,
    ConfigClient,
    Optionalize
} from './types';

const SPECIAL_PROPS = {
    key: true,
    uniqid: true
};

export class TemplateComponentStateless<
    P extends object,
    D extends object
> implements TemplateBase {
    public type: string = TEMPLATE;
    public subtype: string = TEMPLATE_COMPONENT_STATELESS;
    public key: string | number;

    private props: any;

    constructor(
        private componentType: StatelessComponent<P, D>,
        props: Optionalize<P, D> & { key?: string, uniqid?: string } | null,
        children: any
    ) {
        let nextProps: any = props || {};

        nextProps = Object.keys(nextProps).reduce((memo: Map<any>, key: string) => {
            if ((SPECIAL_PROPS as any)[key]) {
                (this as any)[key] = nextProps[key];
            } else {
                memo[key] = nextProps[key];
            }

            return memo;
        }, {});

        nextProps.children = children;

        if (componentType.defaults) {
            for (const name in (componentType as any).defaults) {
                if (nextProps[name] === undefined) {
                    nextProps[name] = (componentType as any).defaults[name];
                }
            }
        }

        this.props = nextProps;
    }

    public renderServer(config: ConfigServer) {
        return stringifyChildrenItem(this.componentType(this.props), config);
    }

    public renderClient(config: ConfigClient, context: Context) {
        const props = this.props;
        let template;
        let component;
        const componentType = this.componentType;
        const { components, nextComponents } = config;
        const id = context.getId();
        const prev = components[id];

        if (prev === undefined || prev.type !== VCOMPONENT_STATELESS || prev.componentType !== componentType) {
            const render = memoize(
                componentType,
                [ undefined ]
                // [ shallowEqualProps ]
            );
            template = render(props);
            component = new VComponentStateless(
                render,
                componentType,
                id,
                template,
                this,
                context
            );

            nextComponents[id] = component;
        } else {
            template = prev.render(props);

            component = new VComponentStateless(
                prev.render,
                componentType,
                id,
                template,
                this,
                context
            );
            nextComponents[id] = component;
        }

        // FIXME: createText and move increment inside render
        let childs;

        if (template) {
            childs = template.renderClient(
                config,
                context.addIdLevel(component)[
                    template.subtype === TEMPLATE_VNODE
                        ? 'incrementDom'
                        : 'incrementComponent'
                ](template.key, template.uniqid)
            );
        } else {
            const nextContext = context.addIdLevel(component).incrementDom();
            const nextTextNode = new VText('', nextContext);
            childs = nextTextNode;
            config.nextNodes[nextContext.getId()] = nextTextNode;
        }

        component.setChilds([childs]);

        return component;
    }
}
