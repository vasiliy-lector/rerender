import { TEMPLATE_FRAGMENT } from './constants';

export class TemplateFragment {
    type = TEMPLATE_FRAGMENT;

    constructor(fragment) {
        this.fragment = fragment;
    }
}
