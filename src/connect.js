import { Component } from './Component';
import { createDecorator } from './createDecorator';
import { memoize, shallowEqual } from './utils';

const identity = value => value;

class Connect extends Component {
    constructor(...args) {
        super(...args);

        this.setState({
            storeState: args[3]
        });
    }

    init() {
        const {
            init,
            select,
            map,
            useProps,
            merge = true
        } = this.options;

        this.selectProps = useProps ? memoize(this.selectProps) : identity;
        this.select = select ? memoize(select) : identity;
        this.map = map ? memoize(map, [shallowEqual]) : identity;
        this.merge = merge !== false ? memoize(this.merge) : identity;

        if (typeof init === 'function') {
            init.call(this);
        }
    }

    componentWillReceiveProps(nextProps, nextStoreState) {
        this.setState({
            storeState: nextStoreState
        });
    }

    selectProps(props) {
        return this.options.useProps.reduce((memo, name) => {
            memo[name] = props[name];

            return memo;
        }, {});
    }

    merge(map, props) {
        const childProps = {};

        for (let name in props) {
            childProps[name] = props[name];
        }

        for (let name in map) {
            childProps[name] = map[name];
        }

        return childProps;
    }

    renderProps() {
        return this.merge(
            this.map(
                this.select(this.state.storeState),
                this.selectProps(this.props)
            ),
            this.props
        );
    }
}

Connect.displayName = 'Connect';
Connect.store = true;

const connect = createDecorator(Connect);

export {
    connect,
    Connect
};
