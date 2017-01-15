import { shallowEqual } from './utils';

// TODO isDom -> enableInitActions or move to jsx.component
function Component(props, children, { isDom, jsx, events, antibind }) {
    this._componentMounted = false;

    if (antibind && Array.isArray(antibind)) {
        for (let i = 0, l = antibind.length; i < l; i++) {
            let name = antibind[i];

            if (typeof this[name] === 'function') {
                this[name] = this[name].bind(this);
            }
        }
    }

    this.isDom = isDom;
    this._events = events;
    this.jsx = jsx;
    this.state = {};
    this.props = props;
    this.children = children;

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

Component.prototype = {
    type: 'Component',

    setState(changes) {
        // FIXME no Object.assign
        let nextState = Object.assign({}, this.state, changes);

        if (!shallowEqual(nextState, this.state)) {
            this.state = nextState;
            Component.emitStateChange(this);
        }
    },

    render() {
        return;
    }
};

Component.beforeRender = function(instance) {
    if (!instance._componentMounted && typeof instance.componentWillMount !== 'undefined') {
        instance.componentWillMount();
    }
};

Component.emitStateChange = function(instance) {
    if (instance._componentMounted && !instance._settingProps) {
        instance._events.emitNextTick('rerender');
    }
};

Component.destroy = function(instance) {
    if (typeof instance.componentWillDestroy !== 'undefined') {
        instance.componentWillDestroy();
    }
};

Component.mount = function(instance) {
    instance._componentMounted = true;

    if (typeof instance.componentDidMount !== 'undefined') {
        instance.componentDidMount();
    }
};

Component.render = function(instance) {
    return instance.render();
};

Component.setProps = function(instance, props, children) {
    if (typeof instance.componentWillReceiveProps !== 'undefined') {
        instance._settingProps = true;
        instance.componentWillReceiveProps(props, children);
        instance._settingProps = false;
    }

    instance.props = props;
    instance.children = children;
};

Component.unmount = function(instance) {
    instance._componentMounted = false;

    if (typeof instance.componentWillUnmount !== 'undefined') {
        instance.componentWillUnmount();
    }
};

export default Component;
