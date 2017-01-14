import { scheduleUpdate } from './render';
import { isSameProps } from './utils';

class Component {
    constructor(props, children, { isDom, jsx, position }) {
        let {
            autoBind = []
            // initActions = []
        } = this.constructor;

        this._componentMounted = false;

        if (autoBind.length) {
            this._autoBindMethods(autoBind);
        }

        this.isDom = isDom;
        this.jsx = jsx;
        this.state = {};
        this.position = position;

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

    _autoBindMethods(methods) {
        for (let i = 0, l = methods.length; i < l; i++) {
            let name = methods[i];

            if (typeof this[name] === 'function') {
                this[name] = this[name].bind(this);
            }
        }
    }

    setState(changes) {
        let nextState = Object.assign({}, this.state, changes);

        if (!isSameProps(nextState, this.state)) {
            this.state = nextState;
            this._componentMounted && !this._settingProps && scheduleUpdate({
                position: this.position,
                instance: this
            });
        }
    }

    render() {
        return '';
    }
}

Component.beforeRender = function(instance) {
    if (!instance._componentMounted && typeof instance.componentWillMount !== 'undefined') {
        instance.componentWillMount();
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
