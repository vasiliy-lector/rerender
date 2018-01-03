import { Store } from './Store';
import { eventDefaults } from './defaults';
import { renderServerStream } from './renderServerStream';
import { Template, EventSettings } from './types';

export type Config<StoreState, Passes> = {
    eventSettings?: EventSettings,
    store?: Store<StoreState>,
    doctype?: string,
    clientScript?: string,
    dehydrate?: boolean,
    passes?: Passes
};

export function renderServer<StoreState>(
    userTemplate: Template,
    config?: Config<StoreState, 1 | undefined>
): string;
export function renderServer<StoreState>(
    userTemplate: Template,
    config?: Config<StoreState, number>
): Promise<string>;
export function renderServer<StoreState>(
    userTemplate: Template,
    {
        eventSettings = eventDefaults,
        store = new Store<StoreState>(),
        doctype,
        clientScript,
        dehydrate = false,
        passes = 1
    }: (Config<StoreState, any>) = {}
): string | Promise<string> {
    return renderServerStream<StoreState>(userTemplate, {
        eventSettings,
        store,
        doctype,
        clientScript,
        dehydrate,
        passes
    });
}
