import Store from './Store';

export default function createAction(action) {
    return ({ store, payload }) => {
        if (!(store instanceof Store)) {
            let error = new Error('Expect required parameter store to be instance of Store!');
            return Promise.reject(error);
        }

        if (payload) {
            return new Promise((resolve, reject) => action({
                payload,
                resolve,
                reject,
                store
            }));
        } else {
            return (payload) => {
                return new Promise((resolve, reject) => action({
                    payload,
                    resolve,
                    reject,
                    store
                }));
            };
        }
    };
}
