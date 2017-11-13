/* tslint:disable member-access */
import { Component } from './Component';
import { memoize, shallowEqual } from './utils';
import { createTemplate } from './createTemplate';

import { Controller, Map, Dispatch } from './types';

type ConnectOptions<MapProps, Props, MergedProps> = {
    deps?: (dispatch: Dispatch, props: Props) => any,
    map?: (storeState: any, props: Props) => MapProps,
    merge?: (result: MapProps, props: Props) => MergedProps
};

type State = {
    storeState: any
};

export function connect<MapProps, Props, MergedProps>({
    map,
    merge = (result, props) => ({
        ...(result as any),
        ...(props as any)
    } as MapProps & Props)
}: ConnectOptions<MapProps, Props, MergedProps>): Controller {
    return  Wrapped =>
        class Connect extends Component<Props, State> {
            static displayName = 'Connect';
            static store = true;

            private merge: (result: MapProps, props: Props) => MergedProps;
            private map?: (storeState: any, props: Props) => MapProps;

            constructor(props: Props, ...args: any[]) {
                super(props, ...args);
                const storeState = args[3];
                this.setState({
                    storeState
                });
                if (map) {
                    this.map = memoize(map, [undefined, shallowEqual]);
                }
                this.merge = memoize(merge, [shallowEqual, shallowEqual]);
            }

            componentWillReceiveProps(nextProps: Props, nextStoreState: any) {
                this.setState({
                    storeState: nextStoreState
                });
            }

            dehydrate(): any {}

            rehydrate(state: any, props: Props, storeState: any) {
                this.setState({
                    storeState
                });
            }

            render() {
                return createTemplate(
                    Wrapped,
                    this.map
                        ? this.merge(this.map(this.state.storeState, this.props), this.props)
                        : this.props,
                    this.props.children
                );
            }
        };
}
