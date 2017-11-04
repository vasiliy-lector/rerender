import { TEMPLATE_FRAGMENT } from './constants';

export class TemplateFragment {
    public type: string = TEMPLATE_FRAGMENT;
    // FIXME: any
    constructor(public fragment: any) {}
}
