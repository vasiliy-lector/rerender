import { shallowEqual } from '../../src/utils/shallowEqual';
import { memoize } from '../../src/utils/memoize';

describe('memoize', () => {
    it('should work without config', () => {
        const fn = (value: any) => ({ value });
        const memoized = memoize(fn);
        const result1 = memoized('a');
        const result2 = memoized('a');
        const result3 = memoized('b');
        const result4 = memoized('b');
        const result5 = memoized('b');

        expect(result1).toEqual({ value: 'a' });
        expect(result1).toBe(result2);
        expect(result3).toEqual({ value: 'b' });
        expect(result3).toBe(result4);
        expect(result3).toBe(result5);
    });

    it('should work with equalityFunctions', () => {
        const fn = (value1: any, value2: any, obj: any) => ({ value1, value2, obj });
        const memoized = memoize(fn, [undefined, undefined, shallowEqual]);
        const result1 = memoized('a', 'b', { c: 'd' });
        const result2 = memoized('a', 'b', { c: 'd' });

        expect(result1).toEqual({
            value1: 'a',
            value2: 'b',
            obj: {
                c: 'd'
            }
        });
        expect(result1).toBe(result2);
    });

    it('should not execute function if initialValues parameter equals firstValues', () => {
        let callsCount = 0;
        const fn = (value1: any, value2: any, obj: any) => {
            callsCount++;
            return { value1, value2, obj };
        };
        const memoized = memoize(fn, [undefined, undefined, shallowEqual], [ 'a', 'b', { c: 'd' } ]);

        memoized('a', 'b', { c: 'd' });
        expect(callsCount).toBe(0);
        memoized('a', 'b', { c: 'e' });
        expect(callsCount).toBe(1);
    });
});
