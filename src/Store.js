import Events from './Events';

class Store extends Events {
    constructor({ reducers = [], state = {} }) {
        super();

        this.state = {};
        this.initActions = [];
        this.initActionsPromises = [];

        this.reducers = reducers.map(Reducer => this.initReducer(Reducer));

        this.rehydrate(state);

        this.reducers.forEach(reducer => this.bindReducer(reducer));
    }

    runInitActions(actions) {
        return Promise.all(actions.map(action => {
            let actionIndex = this.initActions.indexOf(action),
                actionPromise;

            if (actionIndex !== -1) {
                return this.initActionsPromises[actionIndex];
            } else {
                actionPromise = action({
                    store: this
                })();
                this.initActions.push(action);
                this.initActions.push(actionPromise);
                return actionPromise;
            }
        }));
    }

    initReducer(Reducer) {
        let { path, handlers } = Reducer;

        return {
            reducer: new Reducer(),
            handlers,
            path
        };
    }

    bindReducer({ reducer, handlers, path }) {
        for (let event in handlers) {
            if (handlers.hasOwnProperty(event)) {
                this.bindHandler({
                    reducer,
                    event,
                    path,
                    handlerName: handlers[event]
                });
            }
        }
    }

    bindHandler({
        reducer,
        event,
        path,
        handlerName
    }) {
        this.on(event, payload => {
            let newState = reducer[handlerName](this.state[path], payload);
            if (newState !== this.state[path]) {
                this.state[path] = newState;
                this.emit(path, this.state[path]);
                this.emit('change', this.state);
            }
        });
    }

    dehydrate() {
        return this.reducers.reduce((memo, { reducer, path }) => {
            memo[path] = reducer.dehydrate(this.state[path]);

            return memo;
        }, {});
    }

    rehydrate(state) {
        this.reducers.forEach(({ reducer, path }) => {
            this.state[path] = reducer.rehydrate(state[path]);
        });
    }
}

export default Store;
