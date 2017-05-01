import Context from '../src/Context';

describe('Context', () => {
    let context1;
    let context2;

    beforeEach(() => {
        context1 = new Context({
            isDomNode: false,
            parentId: 'r.c0',
            index: 0,
            parentPosition: '',
            domIndex: 0,
            parent: { type: 'c' },
            parentNode: { type: 'n' }
        });
        context2 = new Context({
            isDomNode: true,
            parentId: 'r.c0',
            index: 0,
            parentPosition: '',
            domIndex: 0,
            parent: { type: 'c' },
            parentNode: { type: 'n' }
        });
    });

    describe('new instance', () => {
        it('should calc id, position and domId', () => {
            expect(context1.id).toBe('r.c0.c0');
            expect(context1.position).toBe(undefined);
            expect(context1.domId).toBe(undefined);

            expect(context2.id).toBe('r.c0.0');
            expect(context2.position).toBe('.childNodes[0]');
            expect(context2.domId).toBe(undefined);
        });
    });
});
