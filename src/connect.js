import { Component, t7 } from 'jsunit';
import { hoistStatics } from './utils';

export default function connect({ actions = {}, get, merge }) {
    return (Wrapped) => hoistStatics((() => {
        class Connect extends Component {
            constructor (props, options) {
                super(props, options);
                let { store } = options;
                this.store = store;
                this.bindedActions = this.bindActions();
                this.state = this.getMergedProps();
                store.on('change', () => this.updateState());
            }

            bindActions() {
                let { store } = this;

                return Object.keys(actions).reduce((memo, name) => {
                    memo[name] = actions[name]({ store });

                    return memo;
                }, {});
            }

            updateState() {
                this.setState(this.getMergedProps());
            }

            getMergedProps() {
                let { props } = this,
                    { state } = this.store,
                    storeProps = get ? get(state) : null,
                    allProps = Object.assign({}, props, storeProps || {}, this.bindedActions);

                return merge ? merge(allProps) : allProps;
            }

            render() {
                return t7 `<unit Class=${Wrapped} _=${this.state}>${this.props.children}</unit>`;
            }
        }

        return Connect;
    })(), Wrapped);
}
