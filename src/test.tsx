import { TemplateComponentStateless } from './TemplateComponentStateless';
import { StatelessComponent, Optionalize } from './types';

const h = <
    P extends object,
    D extends object
>(
    componentType: StatelessComponent<P, D>,
    props: Optionalize<P, D> & { key?: string, uniqid?: string } | null,
    ...children: any[]
) => null;

const defaults = { id : 1 };
const Block: StatelessComponent<{ id: number }, typeof defaults> = (props) => props.id.toFixed(0);
Block.defaults = defaults;

const b = h(Block, { uniqid: 'sdf', id: 3 }, null);

const c: any = <Block uniqid='sdf' id={3} />;
