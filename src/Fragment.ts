import { StatelessComponent, Renderable, RenderableArray, Template } from './types';
import { TEMPLATE } from './constants';

export const Fragment: StatelessComponent<{}> = ({ children }) => {
    return children;
};
