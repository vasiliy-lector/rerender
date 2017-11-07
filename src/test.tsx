import { TemplateComponentStateless } from './TemplateComponentStateless';
import { Component } from './Component';
import { StatelessComponent, Optionalize, Renderable } from './types';

declare global {
    namespace JSX {
        type Element = Renderable;

        interface IntrinsicAttributes {
            uniqid?: string;
            key?: string | number;
        }

        interface IntrinsicElements {
            [key: string]: any;
        }
    }
}

const h = <
    P extends object,
    D extends object
>(
    componentType: StatelessComponent<P, D>,
    props: Optionalize<P, D> & { key?: string, uniqid?: string } | null,
    ...children: any[]
): JSX.Element => null;

const defaults = { id : 1 };
const Block: StatelessComponent<{ id: number }, typeof defaults> = (props) => props.id.toFixed(0);
Block.defaults = defaults;

const b = h(Block, { uniqid: 'sdf', id: 3 }, null);

const c: any = <Block uniqid='sdf' key={1} id={3} />;

class BlockWithState extends Component<{ id?: number }, void, typeof defaults> {
    public static defaults = defaults;

    public render() {
        return <form enctype='json'></form>;
    }
}
