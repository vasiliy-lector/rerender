import { TEMPLATE_FRAGMENT } from './constants';
import { Renderable } from './types';

export class TemplateFragment {
    public type: string = TEMPLATE_FRAGMENT;
    constructor(public fragment: Renderable) {}
}
