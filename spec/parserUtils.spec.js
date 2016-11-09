import { getStringsId } from '../src/parserUtils';

describe('Parser utils', () => {
    describe('method getStringsId', () => {
        it('should generate uniq stringId', () => {
            const strings1 = ['a', 'b'],
                strings2 = ['a', 'c'],
                strings3 = ['a'],
                strings1Id1 = getStringsId(strings1),
                strings1Id2 = getStringsId(strings1),
                strings2Id1 = getStringsId(strings2),
                strings2Id2 = getStringsId(strings2),
                strings3Id = getStringsId(strings3);

            expect(strings1Id1).toBeDefined();
            expect(strings2Id2).toBeDefined();
            expect(strings3Id).toBeDefined();

            expect(strings1Id1).toBe(strings1Id2);
            expect(strings2Id1).toBe(strings2Id2);
            expect(strings1Id1).not.toBe(strings2Id1);
            expect(strings1Id1).not.toBe(strings3Id);
            expect(strings1Id2).not.toBe(strings3Id);
        });

        it('should work with clones', () => {
            const strings = ['a', 'b'],
                stringsClone = ['a', 'b'],
                id = getStringsId(strings),
                idClone = getStringsId(stringsClone);

            expect(id).toBeDefined();
            expect(idClone).toBeDefined();
            expect(id).toBe(idClone);
        });
    });
});
