import Component from './Component';
import createDecorator from './createDecorator';
import { memoizeLast } from './utils';

const identity = value => value;

class Connect extends Component {
    constructor(...args) {
        super(...args);

        const {
            init,
            select,
            map,
            useProps,
            merge = true
        } = this.options;

        this.setState({
            storeState: this._options.storeState
        });

        if (init) {
            this.init = init.bind(this, this.dispatch);
        }

        this.selectProps = useProps ? memoizeLast(this.selectProps) : identity;
        this.select = select ? memoizeLast(select) : identity;
        this.map = map ? memoizeLast(map, { shallow: true }) : identity;
        this.merge = merge !== false ? memoizeLast(this.merge) : identity;
    }

    componentWillReceiveProps(nextProps, nextChildren, nextStoreState) {
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

const connect = createDecorator(Connect);

export default connect;
export { Connect };
