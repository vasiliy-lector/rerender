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

    describe('method render', () => {
        it('should render p to string', () => {
            const template = new Template('p', ['className', 'block']);

            expect(template.render()).toBe('<p class="block"></p>');
        });

        it('should render void tag to string', () => {
            const template = new Template('input', ['name', 'name1', 'id', 'id1']);

            expect(template.render()).toBe('<input name="name1" id="id1" />');
        });
    });
});
