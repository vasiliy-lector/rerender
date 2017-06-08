import { deepEqual, shallowClone } from '../src/utils';

describe('utils', () => {
    describe('shallowClone', () => {
        it('should create shallow clone of object', () => {
            var object = {
                id: 1,
                z: {
                    x: 'y'
                }
            };
            var clone = shallowClone(object);
            expect(clone).not.toBe(object);
            expect(clone.id).toBe(object.id);
            expect(clone.z).toBe(object.z);
        });

        it('should create shallow clone of array', () => {
            var array = [
                1,
                { x: 'y' }
            ];
            var clone = shallowClone(array);
            expect(clone).not.toBe(array);
            expect(Array.isArray(clone)).toBe(true);
            expect(clone[0]).toBe(array[0]);
            expect(clone[1]).toBe(array[1]);
        });
    });

    describe('deepEqual', () => {
        var tests = [
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
            [{ a: 1 }, { b: 1 }, false],
            [{ b: 1 }, { a: 1 }, false],
            [{ a: { b: 1 } }, { a: { b: 1 } }, true],
            [{ b: { a: 1 } }, { a: { b: 1 } }, false],
            [{ a: { b: 1 } }, { a: { b: 2 } }, false],
            [[0, 1], [0, 1], true],
            [[0, 1], [1], false],
            [[0, 1], [1, 0], false],
            [[{ a: 1 }, { b: 2 }], [{ a: 1 }, { b: 2 }], true],
            [[{ a: 1 }, { b: 2 }], [{ a: 1 }, { b: 2 }, { c: 3 }], false],
            [[{ a: 1 }, { b: 2 }], [{ a: 1 }, { b: 3 }], false],
            [{
                a: {
                    b: 2,
                    c: {
                        d: 4
                    }
                }
            }, {
                a: {
                    b: 2,
                    c: {
                        d: 4
                    }
                }
            }, true],
            [{
                a: {
                    b: 2,
                    c: {
                        d: '4'
                    }
                }
            }, {
                a: {
                    b: 2,
                    c: {
                        d: 4
                    }
                }
            }, false]
        ];

        var runTests = (tests) => {
            tests.forEach(([one, two, same]) => {
                it (`in case deepEqual(${JSON.stringify(one)}, ${JSON.stringify(two)}) must return ${same}.`, () => {
                    expect(deepEqual(one, two) === same).toBe(true);
                });
            });
        };

        runTests(tests);
    });
});
