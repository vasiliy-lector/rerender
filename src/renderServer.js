import { getWrapHeader, getWrapFooter, getApplicationAfter, applicationId as defaultApplicationId } from './defaults';
import Stream from './Stream';
import Store from './Store';
import Dispatcher from './Dispatcher';

function renderServer(userTemplate, {
    store = new Store(),
    dispatcher = new Dispatcher({ store }),
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

    if (stream === undefined) {
        stream = new Stream();
        concat = true;
    }

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

    userTemplate.renderServer(config);

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

    return Promise.resolve(concat ? html : undefined);
}

export default renderServer;
