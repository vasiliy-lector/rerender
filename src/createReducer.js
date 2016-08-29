import Store from './Store';

export default function createReducer(action) {
    if (typeof action !== 'function') {
        throw new Error('Expect required parameter action to be typeof function!');
    }

    return ({ store, payload }) => {
        if (!(store instanceof Store)) {
            throw new Error('Expect required parameter store to be instance of Store!');
        }

        if (payload) {
            let { state, setState } = store;

            return action({
                payload,
                state,
                setState
            });
        } else {
            return (payload) => {
                let { state, setState } = store;

                return action({
                    payload,
                    state,
                    setState
                });
            };
        }
    };
}
