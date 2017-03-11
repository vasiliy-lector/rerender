import Attrs, { diffAttrs } from '../../src/render/Attrs';

describe('Attrs', () => {
    describe('method diffAttrs', () => {
        it('should create diff', () => {
            const attrs = new Attrs();
            attrs.set('onclick', () => {});
            attrs.set('className', 'block');
            attrs.set('id', 'id1');
            const nextAttrs = new Attrs();
            nextAttrs.set('className', 'block1');
            nextAttrs.set('name', 'name1');
            expect(diffAttrs(attrs, nextAttrs)).toEqual([
                [['className', 'block1'], ['name', 'name1']],
                ['id', 'onclick']
            ]);
        });
    });
});
