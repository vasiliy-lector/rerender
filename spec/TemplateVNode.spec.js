import TemplateVNode, { stringifyAttr } from '../src/TemplateVNode';

describe('server TemplateVNode', () => {
    describe('stringifyAttr', () => {
        it('should return attr string for id', () => {
            expect(stringifyAttr('id', 'block')).toBe(' id="block"');
        });

        it('should return attr string for className', () => {
            expect(stringifyAttr('className', 'block')).toBe(' class="block"');
        });

        it('should return attr string for dataset', () => {
            expect(stringifyAttr('dataset', { id: 'id1', name: 'name1' })).toBe(' data-id="id1" data-name="name1"');
        });

        it('should return attr string for style', () => {
            expect(stringifyAttr('style', { borderRightColor: 'red', border: '0 none' })).toBe(' style="border-right-color: red;border: 0 none;"');
        });

        it('should return empty string for event attr', () => {
            expect(stringifyAttr('onClick', () => {})).toBe('');
        });
    });

    describe('method stringifyAttrs', () => {
        it('should return attrs in simple case', () => {
            const template = new TemplateVNode('p', { id: 'block' });

            expect(template.stringifyAttrs()).toBe(' id="block"');
        });

        it('should correcty work with null and undefined attrs', () => {
            const template = new TemplateVNode('p', null);
            const template2 = new TemplateVNode('p');

            expect(template.stringifyAttrs()).toBe('');
            expect(template2.stringifyAttrs()).toBe('');
        });
    });

    describe('method stringifyChildNodes', () => {
        it('should render text items', () => {
            const template = new TemplateVNode('p', null, ['text 1;', 'another text']);

            expect(template.stringifyChildNodes()).toBe('text 1;another text');
        });

        it('should render components items', () => {
            const children1 = new TemplateVNode('span', null, 'text 1');
            const children2 = new TemplateVNode('span', null, 'text 2');
            const template = new TemplateVNode('p', null, [children1, children2]);

            expect(template.stringifyChildNodes()).toBe('<span>text 1</span><span>text 2</span>');
        });

        it('should render components in one array', () => {
            const children1 = new TemplateVNode('span', null, 'text 1');
            const children2 = new TemplateVNode('span', null, 'text 2');
            const template = new TemplateVNode('p', null, [[children1, children2], 'text']);

            expect(template.stringifyChildNodes()).toBe('<span>text 1</span><span>text 2</span>text');
        });

        it('should escape special symbols', () => {
            const children1 = new TemplateVNode('span', null, 'text < 1');
            const children2 = new TemplateVNode('span', null, 'text > 2');
            const template = new TemplateVNode('p', null, [children1, children2, 'text > me;', '&', ['array >', 'array <', 'array value with &amp;']]);

            expect(template.stringifyChildNodes()).toBe('<span>text &lt; 1</span><span>text &gt; 2</span>text &gt; me;&amp;array &gt;array &lt;array value with &amp;amp;');
        });
    });

    describe('method renderToString', () => {
        it('should render p to string', () => {
            const template = new TemplateVNode('p', { className: 'block' }, []);

            expect(template.renderToString()).toBe('<p class="block"></p>');
        });

        it('should render void tag to string', () => {
            const template = new TemplateVNode('input', {
                name: 'name1',
                id: 'id1'
            }, []);

            expect(template.renderToString()).toBe('<input name="name1" id="id1" />');
        });

        it('should render p with childrens', () => {
            const template = new TemplateVNode('p', { className: 'block' }, [
                'text 1',
                'text 2'
            ]);

            expect(template.renderToString()).toBe('<p class="block">text 1text 2</p>');
        });
    });
});
