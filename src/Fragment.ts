import { StatelessComponent, Renderable, RenderableArray, Template } from './types';
import { TEMPLATE } from './constants';

export const Fragment: StatelessComponent<{}> = ({ children }) => {
    if (Array.isArray(children)) {
        const nextChildren: RenderableArray = [];

        for (let i = 0, l = children.length; i < l; i++) {
            const item = children[i];
            if (isTemplate(item) && !item.key) {
                nextChildren.push({
                    ...item,
                    key: i
                } as Template);
            } else {
                nextChildren.push(item);
            }
        }

        return nextChildren;
    } else {
        return children;
    }
};

function isTemplate(item: Renderable): item is Template {
    return item ? (item as any).type === TEMPLATE : false;
}
