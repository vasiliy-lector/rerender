import { getStringsId, getCacheId } from '../src/parserUtils';

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

    describe('method getCacheId', () => {
        it('should generate uniq cacheId', () => {
            const stringsId1 = 1,
                stringsId2 = 2,
                position1 = [0, 0],
                position1Clone = [0, 0],
                position2 = [0, 1],
                position3 = [1, 2];

            expect(getCacheId(stringsId1, position1)).toBeDefined();
            expect(getCacheId(stringsId1, position2)).toBeDefined();
            expect(getCacheId(stringsId1, position3)).toBeDefined();

            expect(getCacheId(stringsId1, position1)).toBe(getCacheId(stringsId1, position1));
            expect(getCacheId(stringsId1, position1Clone)).toBe(getCacheId(stringsId1, position1));
            expect(getCacheId(stringsId1, position3)).toBe(getCacheId(stringsId1, position3));
            expect(getCacheId(stringsId2, position3)).toBe(getCacheId(stringsId2, position3));
            expect(getCacheId(stringsId1, position2)).toBe(getCacheId(stringsId1, position2));

            expect(getCacheId(stringsId2, position2)).not.toBe(getCacheId(stringsId1, position2));
            expect(getCacheId(stringsId1, position1)).not.toBe(getCacheId(stringsId1, position2));
        });
    });
});
