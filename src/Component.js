import { isSameProps } from './expand';

class Component {
    constructor(props, children, { store, isDom } = {}) {
        let {
            // actions = [],
            autoBind = []
            // initActions = []
        } = this.constructor;

        if (autoBind.length) {
            this.bindMethods(autoBind);
        }

        this.props = props;
        this.children = children;
        this.isDom = isDom;
        this.store = store;
        this.state = {};

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

    // mount(domNode) {
    //     this.domNode = domNode;
    // }

    bindMethods(methods) {
        methods.forEach(name => {
            this[name] = this[name].bind(this);
        });
    }

    setState(changes) {
        let nextState = Object.assign({}, this.state, changes);

        if (!isSameProps(nextState, this.state)) {
            this.state = nextState;
            // FIXME: temporary
            this.store.emit('change');
        }
    }

    setProps(props, children) {
        this.props = props;
        this.children = children;
    }

    // scheduleRender() {
    //     // раз в 10ms производить один reRender, не чаще
    // }

    render() {
        return '';
    }
}

export default Component;
