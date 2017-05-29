import { shallowClone } from '../src/utils';

describe('utils', () => {
    describe('shallowClone', () => {
        it('should create shallow clone of object', () => {
            const object = {
                id: 1,
                z: {
                    x: 'y'
                }
            };
            const clone = shallowClone(object);
            expect(clone).not.toBe(object);
            expect(clone.id).toBe(object.id);
            expect(clone.z).toBe(object.z);
        });
    });
});
