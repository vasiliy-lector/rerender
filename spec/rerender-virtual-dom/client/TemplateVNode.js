import Template from '../../../src/rerender-virtual-dom/client/TemplateVNode';
import VNode from '../../../src/rerender-virtual-dom/client/VNode';

describe('client TemplateVNode', () => {
    describe('method render', () => {
        it('should render p', () => {
            const props = { className: 'block' };
            const template = new Template('p', props);
            const vNode = new VNode('p', props);
            vNode.setChilds();

            expect(template.render({}, {})).toEqual(vNode);
        });
    });
});
