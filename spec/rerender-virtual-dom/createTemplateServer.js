import createTemplateServer from '../../src/rerender-virtual-dom/createTemplateServer';
import Template from '../../src/rerender-virtual-dom/server/Template';

describe('createTemplateServer', () => {
    it('should return instance of template', () => {
        const props = ['id', 'id1'];
        const template = createTemplateServer('p', props, 'text', 'another text');

        expect(template instanceof Template).toBe(true);
        expect(template.instance).toBe('p');
        expect(template.props).toBe(props);
        expect(template.children).toEqual(['text', 'another text']);
    });
});
