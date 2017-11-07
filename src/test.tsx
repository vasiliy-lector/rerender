import { TemplateComponentStateless } from './TemplateComponentStateless';
import { createTemplate as h } from './createTemplate';
import { Component } from './Component';
import { ComponentType, StatelessComponent, Optionalize, Renderable, VirtualDomNode } from './types';

declare global {
    namespace JSX {
        type Element = Renderable;

        interface IntrinsicAttributes {
            controller?: ComponentType<any>;
            uniqid?: string | number;
            key?: string | number;
            ref?: (ref: VirtualDomNode) => any;
            wrapperRef?: (ref: ComponentType<any>) => any;
        }

        interface IntrinsicElements {
            [key: string]: any;
        }
    }
}

// const h = <
//     P extends object,
//     D extends object
// >(
//     componentType: StatelessComponent<P, D>,
//     props: Optionalize<P, D> & { key?: string, uniqid?: string } | null,
//     ...children: any[]
// ): JSX.Element => null;
//
// const b = h(Block, { uniqid: 'sdf', id: 3 }, null);

const defaults = { id : 1 };
const Block: StatelessComponent<{ id?: number }, typeof defaults> = (props) => props.id.toFixed(0);
Block.defaults = defaults;

class BlockWithState extends Component<{ id?: number }, void, typeof defaults> {
    public static defaults = defaults;

    public render() {
        return <form enctype='json'></form>;
    }
}

const c: any = <Block uniqid='sdf' key={1} id={3} controller={BlockWithState} />;
