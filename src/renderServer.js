import defaultHtmlWrapper, { getApplicationAfter } from './defaultHtmlWrapper';
import Store from './Store';
import Dispatcher from './Dispatcher';

function renderServer(userTemplate, settings = {}) {
    const {
        store = new Store(),
        dispatcher = new Dispatcher({ store }),
        applicationId = 'rerender-app',
        wrap = true,
        htmlWrapper = defaultHtmlWrapper,
        title = '',
        head = '',
        bodyEnd = '',
        hashEnabled = true,
        fullHash = false
    } = settings;

    const application = userTemplate.renderToString({
        store,
        dispatcher,
        hashEnabled,
        fullHash,
        hash: 0
    });

    if (!wrap) {
        return application;
    }

    return htmlWrapper({
        title,
        head,
        applicationId,
        application,
        applicationAfter: getApplicationAfter(store, dispatcher, settings),
        bodyEnd
    });
}

export default renderServer;
