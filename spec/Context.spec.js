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

    describe('method addIdLevel', () => {
        it('should return new context', () => {
            const newParent = { type: 'c' };
            const prevParent = context1.parent;
            const context1a = context1.addIdLevel(newParent);

            expect(context1.getParent()).toBe(prevParent);
            expect(context1a.getParent()).toBe(newParent);
        });
    });

    describe('method addDomLevel', () => {
        it('should return new context', () => {
            const newParentNode = { type: 'n' };
            const prevParentNode = context1.parentNode;
            const context1a = context1.addDomLevel(newParentNode);

            expect(context1.getParentNode()).toBe(prevParentNode);
            expect(context1a.getParentNode()).toBe(newParentNode);
        });
    });
});
