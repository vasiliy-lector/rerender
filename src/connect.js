import Component from './Component';
import createDecorator from './createDecorator';
import { memoize } from './utils';

class Connect extends Component {
    constructor(props, children, options) {
        super(props, children, options);

        this.storeState = options.storeState;

        if (this.options.map) {
            this.map = memoize(this.options.map);
        }
        this.merge = memoize(typeof this.options.merge === 'function' ? this.options.merge : this.merge);

        this.setState({
            childProps: this.getChildProps(this.storeState, props)
        });
    }

    componentWillReceiveProps(nextProps, nextChildren, nextStoreState) {
        this.setChildProps(this.getChildProps(nextStoreState, nextProps));
    }

    getChildProps(storeState, props) {
        const map = this.map ? this.map(storeState, props) : storeState;

        return this.merge(map, props);
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
}

Connect.displayName = 'Connect';

const connect = createDecorator(function (props, children, { storeState }) {
}, {
    componentWillReceiveProps(nextProps, nextChildren, nextStoreState) {
        this.setChildProps(this.getChildProps(nextStoreState, nextProps));
    },

    getChildProps(storeState, props) {
        const map = this.map ? this.map(storeState, props) : storeState;

        return  this.merge(map, props);
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
export { Connect };
