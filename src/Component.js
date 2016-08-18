import { scheduleUpdate } from './render';
import { isSameProps } from './utils';

class Component {
    constructor(props, children, { store, isDom, position } = {}) {
        let {
            // actions = [],
            autoBind = []
            // initActions = []
        } = this.constructor;

        this._componentMounted = false;

        if (autoBind.length) {
            this.bindMethods(autoBind);
        }

        this.props = props;
        this.children = children;
        this.isDom = isDom;
        this.store = store;
        this.state = {};
        this.position = position;

        this.init && this.init();

        // this.state = {
        //     initActionsStatus: 'resolved'
        // };
        //
        // if (isDom && initActions.length) {
        //     this.state.initActionsStatus = 'pending';
        //     store.runInitActions(initActions)
        //         .then(() => this.setState({
        //             initActionsStatus: 'resolved'
        //         }), () => this.setState({
        //             initActionsStatus: 'rejected'
        //         }));
        // }
        //
        // this.actions = actions.reduce((memo, Action) => {
        //     memo[Action.name] = isDom
        //         ? params => {
        //             return new Action(Object.assign({}, params, { store }));
        //         }
        //         : () => {};
        //
        //     return memo;
        // }, {});

    }

    bindMethods(methods) {
        methods.forEach(name => {
            this[name] = this[name].bind(this);
        });
    }

    destroy() {
        this.componentWillDestroy && this.componentWillDestroy();
    }

    mount() {
        this._componentMounted = true;
        this.componentDidMount && this.componentDidMount();
    }

    unmount() {
        this._componentMounted = false;
        this.componentWillUnmount && this.componentWillUnmount();
    }

    setState(changes) {
        let nextState = Object.assign({}, this.state, changes);

        if (!isSameProps(nextState, this.state)) {
            this.state = nextState;
            this._componentMounted && scheduleUpdate({
                position: this.position,
                instance: this,
                store: this.store
            });
        }
    }

    setProps(props, children) {
        this.props = props;
        this.children = children;
    }

    render() {
        return '';
    }
}

export default Component;
