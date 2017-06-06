import { defaultHtmlWrapper, getApplicationAfter, applicationId as defaultApplicationId } from './defaults';
import Store from './Store';
import Dispatcher from './Dispatcher';

function renderServer(userTemplate, {
    store = new Store(),
    dispatcher = new Dispatcher({ store }),
    applicationId = defaultApplicationId,
    wrap = true,
    htmlWrapper = defaultHtmlWrapper,
    title = '',
    head = '',
    bodyEnd = '',
    hashEnabled = true,
    fullHash = false
} = {}) {
    const application = userTemplate.renderServer({
        store,
        dispatcher,
        hashEnabled,
        fullHash,
        componentOptions: {
            dispatch: dispatcher.dispatch
        },
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
        applicationAfter: getApplicationAfter({
            store,
            applicationId,
            hashEnabled,
            fullHash
        }),
        bodyEnd
    });
}

export default renderServer;
