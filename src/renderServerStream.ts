import { Store } from './Store';
import { Events } from './Events';
import { eventDefaults } from './defaults';
import { DispatcherFirstRender } from './DispatcherFirstRender';

import { Template, EventSettings, ConfigServer } from './types';

type ConfigStream<StoreState> = {
    eventSettings?: EventSettings,
    store?: Store<StoreState>,
    doctype?: string,
    clientScript?: string,
    dehydrate?: boolean,
    passes?: number,
    stream: true,
    onData: (data: string) => any,
    onEnd: () => any
};

type ConfigNoStream<StoreState, Passes> = {
    eventSettings?: EventSettings,
    store?: Store<StoreState>,
    doctype?: string,
    clientScript?: string,
    dehydrate?: boolean,
    passes?: Passes,
    stream?: false
};

type Config<StoreState, Passes> = ConfigStream<StoreState> | ConfigNoStream<StoreState, Passes>;

export function renderServerStream<StoreState>(
    userTemplate: Template,
    userConfig?: ConfigNoStream<StoreState, 1 | undefined>
): string;
export function renderServerStream<StoreState>(
    userTemplate: Template,
    userConfig?: ConfigNoStream<StoreState, number>
): Promise<string>;
export function renderServerStream<StoreState>(
    userTemplate: Template,
    userConfig?: ConfigStream<StoreState>
): void;

export function renderServerStream<StoreState>(
    userTemplate: Template,
    userConfig: Config<StoreState, any> = {}
): string | Promise<string> | void {
    const {
        eventSettings,
        store = new Store<StoreState>(),
        doctype,
        clientScript,
        dehydrate,
        passes = 1
    } = userConfig;
    const renderChannel = new Events();
    const dispatcher = new DispatcherFirstRender(store, { eventDefaults: eventSettings, isServer: true });
    const config: ConfigServer<StoreState> = {
        store,
        dispatcher,
        hashEnabled: true,
        fullHash: false,
        stream: renderChannel,
        componentOptions: {
            dispatch: dispatcher.dispatch
        },
        hash: 0
    };

    if (userConfig.stream) {
        renderChannel.on('data', userConfig.onData);
        renderChannel.on('end', userConfig.onEnd);
        userTemplate.renderServer(config);
        return;
    } else {
        let html = '';

        renderChannel.on('data', data => {
            html += data;
        });

        if (passes > 1) {
            let promiseResolve: Function;
            const promise = new Promise<string>(resolve => {
                promiseResolve = resolve;
            });
            renderChannel.on('end', () => promiseResolve(html));
            userTemplate.renderServer(config);
            return promise;
        } else {
            userTemplate.renderServer(config);
            return html;
        }
    }
}
