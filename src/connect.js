import createController from './createController';
import memoize from './memoize';

const connect = createController(function (props, children, { storeState }) {
    this.storeState = storeState;

    if (typeof this.options.preMap === 'function') {
        this.preMap = memoize(this.options.preMap);
    }

    if (typeof this.options.preProps === 'function') {
        this.preProps = memoize(this.options.preProps);
    }

    if (typeof this.options.map === 'function') {
        this.map = memoize(this.options.map);
    }

    if (typeof this.options.merge === 'function') {
        this.merge = memoize(this.options.merge);
    }
}, {
    init() {
        const map = this.merge(this.map(this.storeState, this.props));
        this.setState({
            childProps: this.merge(map)
        });
    },

    componentWillReceiveProps(nextProps, nextChildren, nextStoreState) {
        if (nextProps !== this.props || nextStoreState !== this.storeState) {
            this.storeState = nextStoreState;
            this.setChildProps(this.merge(this.map(nextStoreState, nextProps)));
        }
    },

    preMap(storeState) {
        return storeState;
    },

    preProps(props) {
        return props;
    },

    map(storeState) {
        return storeState;
    },

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
}, {
    displayName: 'Connect',
    connect: true
});

export default connect;
