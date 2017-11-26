import { Store } from './Store';
import { eventDefaults } from './defaults';
import { Template, EventDefaults } from './types';

type Config<StoreState, Passes> = {
    eventSettings?: EventDefaults,
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
    return '';
}
