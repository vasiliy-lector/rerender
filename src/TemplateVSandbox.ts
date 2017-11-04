import { Context } from './Context';
import { VSandbox } from './VSandbox';
import { ConfigClient, TemplateBase } from './types';

const rootContext = new Context({
    parentId: 'r',
    parentNodeId: 'r',
    index: 0,
    parentPosition: '',
    domIndex: 0
});

export class TemplateVSandbox {
    constructor(private domNode: HTMLElement, private template: TemplateBase) {}

    public renderClient(config: ConfigClient, context: Context) {
        const sandbox = new VSandbox(this.domNode);

        if (context === undefined) {
            context = rootContext;
            context.rootNode = this.domNode;
        }
        context.parentNode = sandbox;
        context.parent = sandbox;
        sandbox.setChilds([this.template.renderClient(config, context)]);

        return sandbox;
    }
}
