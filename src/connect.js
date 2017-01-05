import Component from './Component';
import jsx from './jsx';
import { hoistStatics } from './utils';

export default function connect({ actions = {}, get, merge, watch }) {
    return (Wrapped) => hoistStatics((() => {
        class Connect extends Component {
            constructor (props, children, options) {
                super(props, children, options);
                let { store } = options;
                this.store = store;
                this.bindedActions = this.bindActions();
                this.state = this.getMergedProps();
                if (typeof watch === 'undefined' && get) {
                    watch = 'change';
                }
                if (watch) {
                    store.on(watch, () => this.updateState());
                }
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
                return jsx `<${Wrapped} ${this.state}>${this.children}</${Wrapped}>`;
            }
        }

        return Connect;
    })(), Wrapped);
}
