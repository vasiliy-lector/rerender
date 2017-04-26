import createReducer from '../src/createReducer';
import Store from '../src/Store';

describe('createReducer', () => {
    let action,
        reducer;

    const store = new Store();

    beforeEach(() => {
        action = jasmine.createSpy(),
        reducer = createReducer(action);
    });

    it ('should create function', () => {
        expect(typeof reducer).toBe('function');
    });

    it('should throw error if action is not function', () => {
        expect(() => {
            createReducer();
        }).toThrow(new Error('Expect required parameter action to be typeof function!'));
    });

    it('should throw error if store is not instance of Store', () => {
        expect(() => {
            reducer({
                store: {}
            });
        }).toThrow(new Error('Expect required parameter store to be instance of Store!'));
    });

    it('should bind store when payload not given', () => {
        const binded = reducer({ store }),
            payload = {
                id: 1
            },
            { state, setState } = store;

        expect(typeof binded).toBe('function');
        expect(action).not.toHaveBeenCalled();
        binded(payload);
        expect(action).toHaveBeenCalledWith({
            payload,
            state,
            setState
        });
    });

    it('should execute when payload given', () => {
        const
            payload = {
                id: 1
            },
            { state, setState } = store;

        reducer({ payload, store });
        expect(action).toHaveBeenCalledWith({
            payload,
            state,
            setState
        });
    });
});
