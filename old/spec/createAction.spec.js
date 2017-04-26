import createAction from '../src/createAction';
import Store from '../src/Store';

describe('createAction', () => {
    let fn,
        action;

    const store = new Store();

    beforeEach(() => {
        fn = jasmine.createSpy(),
        action = createAction(fn);
    });

    it ('should create function', () => {
        expect(typeof action).toBe('function');
    });

    it('should throw error if action is not function', () => {
        expect(() => {
            createAction();
        }).toThrow(new Error('Expect required parameter action to be typeof function!'));
    });

    it('should throw error if store is not instance of Store', () => {
        expect(action({store: {}}))
            .toEqual(Promise.reject(new Error('Expect required parameter store to be instance of Store! May be you try to call action directly and forget bind store.')));
    });

    it('should bind store when payload not given', () => {
        const binded = action({ store }),
            payload = {
                id: 1
            };

        expect(typeof binded).toBe('function');
        expect(fn).not.toHaveBeenCalled();

        const result = binded(payload);
        expect(result instanceof Promise).toBe(true);
        return result
            .then(() => {
                expect(fn).toHaveBeenCalledWith({
                    payload,
                    resolve: Promise.resolve,
                    reject: Promise.reject,
                    actions: {},
                    store
                });
            });
    });

    it('should execute when payload given', () => {
        const
            payload = {
                id: 1
            };

        const result = action({ payload, store });
        expect(result instanceof Promise).toBe(true);
        return result
            .then(() => {
                expect(fn).toHaveBeenCalledWith({
                    payload,
                    resolve: Promise.resolve,
                    reject: Promise.reject,
                    actions: {},
                    store
                });
            });
    });

    it('should deps actions to be binded', () => {
        const
            fn2Binded = jasmine.createSpy(),
            fn2 = jasmine.createSpy().and.returnValue(fn2Binded),
            action = createAction(fn, { fn2 }),
            payload = {
                id: 1
            },
            result = action({
                store,
                payload
            });

        expect(result instanceof Promise).toBe(true);
        return result
            .then(() => {
                expect(fn).toHaveBeenCalledWith({
                    payload,
                    resolve: Promise.resolve,
                    reject: Promise.reject,
                    actions: {
                        fn2: fn2Binded
                    },
                    store
                });
            });
    });
});
