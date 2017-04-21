import Template from '../../../src/rerender-virtual-dom/client/TemplateVNode';
import VNode from '../../../src/rerender-virtual-dom/client/VNode';

describe('server Template', () => {
    describe('method render', () => {
        it('should render p', () => {
            const props = { className: 'block' };
            const template = new Template('p', props);

            expect(template.render({}, {})).toEqual(new VNode('p', { className: 'block' }));
        });
    });
});
