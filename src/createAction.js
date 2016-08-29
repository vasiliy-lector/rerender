import Store from './Store';

export default function createAction(action, deps) {
    if (typeof action !== 'function') {
        throw new Error('Expect required parameter action to be typeof function!');
    }

    return ({ store, payload }) => {
        if (!(store instanceof Store)) {
            let error = new Error('Expect required parameter store to be instance of Store! May be you try to call action directly and forget bind store.');
            return Promise.reject(error);
        }

        let actions = {};

        if (deps) {
            Object.keys(deps).forEach(name => actions[name] = deps[name]({store}));
        }

        if (payload) {
            return new Promise((resolve, reject) => action({
                payload,
                resolve,
                reject,
                actions,
                store
            }));
        } else {
            return (payload) => {
                return new Promise((resolve, reject) => action({
                    payload,
                    resolve,
                    reject,
                    actions,
                    store
                }));
            };
        }
    };
}
