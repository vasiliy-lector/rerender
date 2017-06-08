import { escapeAttr, escapeHtml, shallowEqual } from '../src/utils';

describe('utils', () => {
    describe('shallowEqual', () => {
        const
            a = {},
            prop1 = {
                a
            },
            prop2 = {
                a
            },
            obj1 = { prop1 },
            obj2 = { prop1 },
            obj3 = { prop2 },
            obj4 = {
                prop1: 'a',
                prop2: 'b'
            },
            obj5 = {
                prop1: 'a',
                prop2: 'b'
            },
            arr1 = [obj1, obj2, obj3],
            arr2 = [obj1, obj2, obj3],
            arr3 = [obj1, obj3],
            obj6 = {
                prop1,
                prop2: arr1
            },
            obj7 = {
                prop1,
                prop2: arr2
            },
            obj8 = {
                prop1,
                prop2: arr3
            },
            obj9 = {
                prop1,
                prop2: arr1
            },
            runTests = (tests) => {
                tests.forEach(({ caseDescr, one, two, same }) => {
                    it (`in case "${caseDescr}" must return ${same}.`, () => {
                        expect(shallowEqual(one, two) === same).toBe(true);
                    });
                });
            },
            tests = [
                {
                    caseDescr: 'obj1, obj1',
                    one: obj1,
                    two: obj1,
                    same: true
                },
                {
                    caseDescr: 'obj1, obj2',
                    one: obj1,
                    two: obj2,
                    same: true
                },
                {
                    caseDescr: 'obj1, obj3',
                    one: obj1,
                    two: obj3,
                    same: false
                },
                {
                    caseDescr: 'obj4, obj5',
                    one: obj4,
                    two: obj5,
                    same: true
                },
                {
                    caseDescr: 'arr1, arr2',
                    one: arr1,
                    two: arr2,
                    same: true
                },
                {
                    caseDescr: 'obj6, obj7',
                    one: obj6,
                    two: obj7,
                    same: false
                },
                {
                    caseDescr: 'obj6, obj8',
                    one: obj6,
                    two: obj8,
                    same: false
                },
                {
                    caseDescr: 'obj6, obj9',
                    one: obj6,
                    two: obj9,
                    same: true
                },
                {
                    caseDescr: 'str, obj5',
                    one: '1',
                    two: obj5,
                    same: false
                },
                {
                    caseDescr: 'case 1',
                    one: {
                        a: ['1', '2']
                    },
                    two: {
                        a: ['1', 2]
                    },
                    same: false
                }
            ];

        runTests(tests);
    });

    describe('escapeHtml', () => {
        it('should replace angulars', () => {
            expect(escapeHtml('<div class="item">text</div>'))
                .toBe('&lt;div class="item"&gt;text&lt;/div&gt;');
        });

        it('should convert not string to string', () => {
            expect(escapeHtml(1)).toBe('1');
        });
    });

    describe('escapeAttr', () => {
        it('should replace attribute disabled symbols', () => {
            expect(escapeAttr('<a href="http://localhost/?x=1&y=2">text</a>'))
                .toBe('&lt;a href=&quot;http://localhost/?x=1&amp;y=2&quot;&gt;text&lt;/a&gt;');
        });

        it('should convert not string to string', () => {
            expect(escapeAttr(1)).toBe('1');
        });
    });
});
