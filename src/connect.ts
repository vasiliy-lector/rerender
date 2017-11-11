/* tslint:disable member-access */
import { Component } from './Component';
import { createDecorator } from './createDecorator';
import { memoize, shallowEqual } from './utils';
import { createTemplate } from './createTemplate';

import { Decorator, Map } from './types';

type ConnectOptions<MapProps, Props, MergedProps> = {
    deps?: () => any,
    map?: (storeState: any, props: Props) => MapProps,
    merge?: (result: MapProps, props: Props) => MergedProps
};

type State = {
    storeState: any
};

export function connect<MapProps, Props, MergedProps>({
    deps,
    map,
    merge = (result, props) => ({
        ...(result as any),
        ...(props as any)
    } as MapProps & Props)
}: ConnectOptions<MapProps, Props, MergedProps>): Decorator {
    return  Wrapped =>
        class Connect extends Component<Props, State> {
            static displayName = 'Connect';
            static store = true;

            private merge: (result: MapProps, props: Props) => MergedProps;
            private map?: (storeState: any, props: Props) => MapProps;

            constructor(props: Props, ...args: any[]) {
                super(props, ...args);
                this.setState({
                    storeState: args[3]
                });
                if (map) {
                    this.map = memoize(map, [undefined, shallowEqual]);
                }
                this.merge = memoize(merge);
            }

            init() {
                if (deps) {
                    deps.call(this);
                }
            }

            componentWillReceiveProps(nextProps: Props, nextStoreState: any) {
                this.setState({
                    storeState: nextStoreState
                });
            }

            render() {
                return createTemplate(
                    Wrapped,
                    map ? merge(map(this.state.storeState, this.props), this.props) : this.props,
                    this.props.children
                );
            }
        };
}
