import { isSameProps } from '../src/utils';

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
    arr4 = [obj1, obj2, obj3],
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
                expect(isSameProps(one, two) === same).toBe(true);
            });
        });
    };

describe('isSameProps', () => {
    let tests = [
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
            same: true
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
            same: false
        }
    ];

    runTests(tests);
});
