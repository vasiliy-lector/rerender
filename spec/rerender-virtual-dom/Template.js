import Template, { renderAttr } from '../../src/rerender-virtual-dom/server/Template';

describe('server Template', () => {
    describe('renderAttr', () => {
        it('should return attr string for id', () => {
            expect(renderAttr('id', 'block')).toBe(' id="block"');
        });
        it('should return attr string for className', () => {
            expect(renderAttr('className', 'block')).toBe(' class="block"');
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
            const template = new Template('p', ['id', 'id1', 'id', 'id2']);

            expect(template.renderAttrs()).toBe(' id="id2"');
        });
    });
    // it('should render VNode to string', () => {
    //     const template = new Template('p', ['className', 'block'], ['text']);
    //
    //     expect(template.render({})).toBe('<p class="block">text</p>');
    // });
});
