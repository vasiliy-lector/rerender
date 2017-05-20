import defaultHtmlWrapper, { getApplicationAfter } from './defaultHtmlWrapper';
import Store from './Store';
import Dispatcher from './Dispatcher';

function renderServer(userTemplate, {
    store = new Store(),
    dispatcher = new Dispatcher({ store }),
    applicationId = 'rerender-app',
    blankRender = false,
    wrap = true,
    htmlWrapper = defaultHtmlWrapper,
    title = '',
    head = '',
    bodyEnd = '',
    hashEnabled = true,
    fullHash = false
} = {}) {

    const application = userTemplate.renderToString({
        store,
        dispatcher,
        blankRender,
        hashEnabled,
        fullHash,
        hash: 0
    });

    if (!wrap || blankRender) {
        return application;
    }

    return htmlWrapper({
        title,
        head,
        applicationId,
        application,
        applicationAfter: getApplicationAfter(store, dispatcher),
        bodyEnd
    });
}

export default renderServer;
