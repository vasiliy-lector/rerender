import { shallowEqual, EqualityFunction } from '../../src/utils/shallowEqual';

export type EqualityTest = [any, any, boolean];

export const runTests = (
    tests: EqualityTest[],
    equalityFunction: EqualityFunction,
    functionName: string = 'isEqual'
): void => {
    tests.forEach(([one, two, same]: EqualityTest) => {
        const message = `in case ${functionName}(${JSON.stringify(one)}, ${JSON.stringify(two)}) must return ${same}.`;

        it (message, () => {
            expect(equalityFunction(one, two)).toBe(same);
        });
    });
};

describe('shallowEqual', () => {
    const link = {};
    const tests: EqualityTest[] = [
        [0, 0, true],
        [0, 1, false],
        [1, 0, false],
        ['', '', true],
        ['', 'r', false],
        ['r', '', false],
        ['re', 're', true],
        ['re', 'we', false],
        ['we', 're', false],
        [null, null, true],
        [null, undefined, false],
        [undefined, null, false],
        [false, false, true],
        [true, true, true],
        [true, false, false],
        [false, true, false],
        [false, null, false],
        [null, false, false],
        [{}, {}, true],
        [{ a: 1 }, { a: 1 }, true],
        [{ a: 1, b: '6' }, { a: 1, b: '6' }, true],
        [{ a: 1, b: link }, { a: 1, b: link }, true],
        [{ a: 1, b: link }, { a: 2, b: link }, false],
        [{ a: 1 }, { b: 1 }, false],
        [{ a: { b: 1 } }, { a: { b: 1 } }, false],
        [[0, 1], [0, 1], true],
        [[0, 1], [1], false]
    ];

    runTests(tests, shallowEqual, 'shallowEqual');
});
