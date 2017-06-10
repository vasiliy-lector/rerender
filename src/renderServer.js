import { getWrapHeader, getWrapFooter, getApplicationAfter, applicationId as defaultApplicationId } from './defaults';
import Stream from './Stream';
import Store from './Store';
import Dispatcher from './Dispatcher';
import { mayAsync } from './utils';

function renderServer(userTemplate, {
    dispatcher,
    applicationId = defaultApplicationId,
    stream,
    concat,
    wrap = false,
    title = '',
    head = '',
    bodyEnd = '',
    hashEnabled = true,
    fullHash = false
} = {}) {
    let html;
    const store = new Store();

    if (stream === undefined) {
        stream = new Stream();
        concat = true;
    }

    if (dispatcher === undefined) {
        dispatcher = new Dispatcher({ store, isServer: true });
    }
    dispatcher.stopWarmup();

    if (concat) {
        html = '';
        stream.on('data', data => {
            html += data;
        });
    }

    if (wrap) {
        stream.emit('data', getWrapHeader({
            title,
            head,
            applicationId
        }));
    }

    const config = {
        store,
        dispatcher,
        hashEnabled,
        fullHash,
        stream,
        componentOptions: {
            dispatch: dispatcher.dispatch
        },
        hash: 0
    };

    var promise = new Promise(resolve => {
        stream.on('end', html => resolve(html));
    });

    mayAsync(userTemplate.renderServer(config), () => {
        if (wrap) {
            stream.emit('data', getApplicationAfter({
                dispatcherState: dispatcher.dehydrate(),
                hashEnabled,
                fullHash,
                hash: config.hash
            }));

            stream.emit('data', getWrapFooter({
                bodyEnd
            }));
        }

        stream.emit('end', concat ? html : undefined);
    }, config);

    return promise;
}

export default renderServer;
