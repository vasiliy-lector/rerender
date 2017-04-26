import createTemplateServer from '../../src/rerender-virtual-dom/createTemplateServer';
import TemplateVNode from '../../src/rerender-virtual-dom/server/TemplateVNode';

describe('createTemplateServer', () => {
    it('should return instance of template', () => {
        const props = ['id', 'id1'];
        const template = createTemplateServer('p', props, 'text', 'another text');

        expect(template instanceof TemplateVNode).toBe(true);
        expect(template.tag).toBe('p');
        expect(template.props).toBe(props);
        expect(template.children).toEqual(['text', 'another text']);
    });
});
