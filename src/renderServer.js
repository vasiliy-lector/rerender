import { getWrapHeader, getWrapFooter, getApplicationAfter, applicationId as defaultApplicationId } from './defaults';
import Stream from './Stream';
import DispatcherFirstRender from './DispatcherFirstRender';
import { mayAsync } from './utils';

function renderServer(userTemplate, {
    applicationId = defaultApplicationId,
    stream,
    wrap = false,
    title = '',
    head = '',
    bodyEnd = '',
    hashEnabled = true,
    eventDefaults,
    fullHash = false
} = {}) {
    let html;
    let concat;

    if (stream === undefined) {
        stream = new Stream();
        concat = true;
    }

    const dispatcher = new DispatcherFirstRender({ eventDefaults, isServer: true });

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
        store: dispatcher.store,
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
                dispatcherCache: dispatcher.dehydrate(),
                hashEnabled,
                fullHash,
                eventDefaults,
                hash: config.hash
            }));

            stream.emit('data', getWrapFooter({
                bodyEnd
            }));
        }

        stream.emit('end', concat ? html : undefined);
    }, error => config.stream.emit('error', error));

    return promise;
}

export default renderServer;
