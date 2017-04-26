import createTemplate from '../src/createTemplate';
import TemplateVNode from '../src/TemplateVNode';

describe('createTemplate', () => {
    it('should return instance of template', () => {
        const props = { id: 'id1' };
        const template = createTemplate('p', props, 'text', 'another text');

        expect(template instanceof TemplateVNode).toBe(true);
        expect(template.tag).toBe('p');
        expect(template.attrs).toBe(props);
        expect(template.children).toEqual(['text', 'another text']);
    });
});
