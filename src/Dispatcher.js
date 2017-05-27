function Dispatcher({ store, state = {}, server = false, dehydrate, rehydrate }) {
    this.providedDehydrate = dehydrate;
    this.providedRehydrate = rehydrate;
    this.store = store;
    this.state = state;
    this.server = server;
    this.dispatch = this.dispatch.bind(this);
    // FIXME: disable change inside reducers and actions
    this.actionOptions = {
        dispatch: this.dispatch,
        getState: store.getState
    };
    this.reducerOptions = {
        getState: store.getState,
        setState: store.setState
    };
}

Dispatcher.prototype = {
    dispatch(event, ...payload) {
        if (typeof event.action !== 'function') {
            this.runReducers(event, payload[0]);

            return Promise.resolve(payload[0]);
        }

        return this.runAction(event, payload).then(actionResult => {
            this.runReducers(event, actionResult);

            return actionResult;
        });
    },

    runAction(event, payload) {
        const actionResult = event.action(this.actionOptions, ...payload);

        if (actionResult instanceof Promise) {
            return actionResult;
        } else {
            return Promise.resolve(actionResult);
        }
    },

    runReducers(event, payload) {
        if (!event.reducers || !event.reducers.length) {
            return;
        }

        for (let i = 0, l = event.reducers.length; i < l; i++) {
            event.reducers[i](this.reducerOptions, payload);
        }
    },

    setServer() {
        this.server = true;
    },

    dehydrate() {
        return this.providedDehydrate ? this.providedDehydrate(this.state) : this.state;
    },

    rehydrate(state) {
        return this.providedRehydrate ? this.providedRehydrate(state) : state;
    }
};

export default Dispatcher;
