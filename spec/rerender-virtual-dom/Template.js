import Template, { renderAttr } from '../../src/rerender-virtual-dom/server/Template';

describe('server Template', () => {
    describe('renderAttr', () => {
        it('should return attr string for id', () => {
            expect(renderAttr('id', 'block')).toBe(' id="block"');
        });

        it('should return attr string for className', () => {
            expect(renderAttr('className', 'block')).toBe(' class="block"');
        });

        it('should return attr string for dataset', () => {
            expect(renderAttr('dataset', { id: 'id1', name: 'name1' })).toBe(' data-id="id1" data-name="name1"');
        });

        it('should return attr string for style', () => {
            expect(renderAttr('style', { borderRightColor: 'red', border: '0 none' })).toBe(' style="border-right-color:red;border:0 none;"');
        });

        it('should return empty string for event attr', () => {
            expect(renderAttr('onClick', () => {})).toBe('');
        });
    });

    describe('method renderAttrs', () => {
        it('should return attrs in simple case', () => {
            const template = new Template('p', ['id', 'block']);

            expect(template.renderAttrs()).toBe(' id="block"');
        });

        it('should correcty work with null and undefined attrs', () => {
            const template = new Template('p', null);
            const template2 = new Template('p');

            expect(template.renderAttrs()).toBe('');
            expect(template2.renderAttrs()).toBe('');
        });

        it('should return attrs in dots case', () => {
            const template = new Template('p', ['...', { className: 'block', id: 'id1' }]);

            expect(template.renderAttrs()).toBe(' id="id1" class="block"');
        });

        it('should return only last value', () => {
            const template = new Template('p', ['id', 'id1', 'id', 'id2', 'className', 'block', 'id', 'id3']);

            expect(template.renderAttrs()).toBe(' class="block" id="id3"');
        });

        it('should return only last value in dots case', () => {
            const template = new Template('p', ['...', { id: 'id1' }, 'id', 'id2']);
            const template2 = new Template('p', ['id', 'id2', '...', { id: 'id1' }]);

            expect(template.renderAttrs()).toBe(' id="id2"');
            expect(template2.renderAttrs()).toBe(' id="id1"');
        });
    });

    describe('method renderChildrens', () => {
        it('should render text items', () => {
            const template = new Template('p', ['id', 'block'], ['text 1;', 'another text']);

            expect(template.renderChildrens()).toBe('text 1;another text');
        });

        it('should render components items', () => {
            const children1 = new Template('span', null, 'text 1');
            const children2 = new Template('span', null, 'text 2');
            const template = new Template('p', null, [children1, children2]);

            expect(template.renderChildrens()).toBe('<span>text 1</span><span>text 2</span>');
        });

        it('should render components in one array', () => {
            const children1 = new Template('span', null, 'text 1');
            const children2 = new Template('span', null, 'text 2');
            const template = new Template('p', null, [[children1, children2], 'text']);

            expect(template.renderChildrens()).toBe('<span>text 1</span><span>text 2</span>text');
        });

        it('should escape special symbols', () => {
            const children1 = new Template('span', null, 'text < 1');
            const children2 = new Template('span', null, 'text > 2');
            const template = new Template('p', null, [children1, children2, 'text > me', '&']);

            expect(template.renderChildrens()).toBe('<span>text &lt; 1</span><span>text &gt; 2</span>text &gt; me&amp;');
        });
    });

    describe('method render', () => {
        it('should render p to string', () => {
            const template = new Template('p', ['className', 'block'], []);

            expect(template.render()).toBe('<p class="block"></p>');
        });

        it('should render void tag to string', () => {
            const template = new Template('input', ['name', 'name1', 'id', 'id1'], []);

            expect(template.render()).toBe('<input name="name1" id="id1" />');
        });

        it('should render p with childrens', () => {
            const template = new Template('p', ['className', 'block'], [
                'text 1',
                'text 2'
            ]);

            expect(template.render()).toBe('<p class="block">text 1text 2</p>');
        });
    });
});
