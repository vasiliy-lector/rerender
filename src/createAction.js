import Store from './Store';

export default function createAction(action, deps) {
    return ({ store, payload }) => {
        if (!(store instanceof Store)) {
            let error = new Error('Expect required parameter store to be instance of Store!');
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
