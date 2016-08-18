import { scheduleUpdate } from './render';
import { isSameProps, debug } from './utils';

const
    SIMPLE_TYPES = {
        'string': true,
        'boolean': true,
        'number': true,
        'function': true
    },
    getPropType = function(prop) {
        if (Array.isArray(prop)) {
            return 'array';
        } else if (SIMPLE_TYPES[typeof prop]) {
            return typeof prop;
        } else if (typeof prop === 'object') {
            if (prop instanceof Component) {
                return 'component';
            } else if (prop === null) {
                return 'null';
            } else {
                return 'object';
            }
        } else {
            return typeof prop;
        }
    },
    checkProps = function(props = {}, component, position) {
        let {
            types = {},
            required = {},
            name: componentName
        } = component;

        Object.keys(types).forEach(name => {
            let type = getPropType(props[name]);

            if (props[name] && type !== types[name]) {
                debug[ required[name] ? 'error' : 'warn' ](`Component ${componentName} (${position}) expected property ${name} of type ${types[name]} but ${type} given`);
            } else if (types[name] && !props[name]) {
                debug.error(`Component ${componentName} (${position}) required property ${name} of type ${types[name]}`);
            }
        });

    };

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

        this.isDom = isDom;
        this.store = store;
        this.state = {};
        this.position = position;

        this.setProps(props, children);

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

export { checkProps };
