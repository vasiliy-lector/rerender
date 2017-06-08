import createTemplate from '../src/createTemplate';
import TemplateVNode from '../src/TemplateVNode';
import TemplateComponent from '../src/TemplateComponent';
import TemplateComponentStateless from '../src/TemplateComponentStateless';
import TemplateFragment from '../src/TemplateFragment';
import Component from '../src/Component';

describe('createTemplate', () => {
    it('should return instance of TemplateVNode', () => {
        var props = { id: 'id1' };
        var template = createTemplate('p', props, 'text', 'another text');

        expect(template instanceof TemplateVNode).toBe(true);
        expect(template.tag).toBe('p');
        expect(template.attrs).toEqual(props);
        expect(template.children).toEqual(['text', 'another text']);
    });

    it('should work with null attrs and children', () => {
        var template = createTemplate('p', null, null);

        expect(template.attrs).toBe(null);
        expect(template.children).toBe(null);
    });

    it('should work with undefined attrs', () => {
        var template = createTemplate('p');

        expect(template.attrs).toBe(null);
        expect(template.children).toBe(null);
    });

    it('should return instance of TemplateComponent', () => {
        var props = { id: 'id1' };
        class Block extends Component {}
        var template = createTemplate(Block, props, 'text', 'another text');

        expect(template instanceof TemplateComponent).toBe(true);
        expect(template.props).toEqual(props);
        expect(template.children instanceof TemplateFragment).toBe(true);
        expect(template.children.fragment).toEqual(['text', 'another text']);
    });

    it('should work with null props and children for components', () => {
        class Block extends Component {}
        var template = createTemplate(Block, null, null);

        expect(template instanceof TemplateComponent).toBe(true);
        expect(template.props).toEqual({});
        expect(template.children).toBe(null);
    });

    it('should work with undefined props and children for components', () => {
        class Block extends Component {}
        var template = createTemplate(Block);

        expect(template instanceof TemplateComponent).toBe(true);
        expect(template.props).toEqual({});
        expect(template.children).toBe(null);
    });

    it('should return instance of TemplateComponentStateless', () => {
        var props = { id: 'id1' };
        var template = createTemplate(function() {}, props, 'text', 'another text');

        expect(template instanceof TemplateComponentStateless).toBe(true);
        expect(template.props).toEqual(props);
        expect(template.children instanceof TemplateFragment).toBe(true);
        expect(template.children.fragment).toEqual(['text', 'another text']);
    });

});
