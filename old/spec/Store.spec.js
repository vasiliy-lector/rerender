import Store from '../src/Store';
import { debug } from '../src/debug';

describe('Store', () => {
    const INITIAL_STATE = {
        routes: {
            route: 'Index'
        }
    };
    let store;

    beforeEach(() => {
        store = new Store({
            state: INITIAL_STATE,
            dehydrate(state) {
                return state;
            },
            rehydrate(state) {
                return state;
            }
        });

        spyOn(debug, 'log');
        spyOn(debug, 'error');
        spyOn(debug, 'warn');
        spyOn(store, 'emit');
    });

    describe('method setState', () => {
        it('should correctly init if no parameters given', () => {
            store = new Store();
            expect(store.state).toEqual({});
        });

        it('should do nothing if trying set empty object', () => {
            expect(store.state).toBe(INITIAL_STATE);
            store.setState({});
            expect(store.state).toBe(INITIAL_STATE);
        });

        it('should do nothing if first level paths recognized as same by method isSameProps', () => {
            const state = store.state;

            store.setState({
                routes: {
                    route: 'Index'
                }
            });
            expect(store.state).toBe(state);
            expect(debug.warn).toHaveBeenCalledTimes(1);
            expect(store.emit).not.toHaveBeenCalled();
        });

        it('should set new state', () => {
            const NEW_STATE = {
                routes: {
                    route: 'Second'
                }
            };

            store.setState(NEW_STATE);

            expect(store.state).toEqual(NEW_STATE);
            expect(store.emit).toHaveBeenCalledWith('change');
            expect(store.emit).toHaveBeenCalledWith('routes');
        });
    });

    describe('method dehydrate', () => {
        it('should return state', () => {
            expect(store.dehydrate()).toEqual(INITIAL_STATE);
        });

        it('should use default dehydrate if dehydrate was not specified', () => {
            store = new Store({
                state: INITIAL_STATE
            });
            expect(store.dehydrate()).toEqual(INITIAL_STATE);
        });
    });

    describe('method rehydrate', () => {
        it('should return state', () => {
            expect(store.rehydrate(INITIAL_STATE)).toEqual(INITIAL_STATE);
        });

        it('should use default rehydrate if rehydrate was not specified', () => {
            store = new Store({
                state: INITIAL_STATE
            });
            expect(store.state).toEqual(INITIAL_STATE);
        });
    });
});
