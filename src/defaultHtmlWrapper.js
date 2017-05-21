import { escapeAttr, escapeHtml } from './utils';

const defaultHtmlWrapper = ({
    title,
    head,
    applicationId,
    application,
    applicationAfter,
    bodyEnd
}) => `<!DOCTYPE html>
<html>
<head>
    <title>${escapeHtml(title)}</title>
    ${head}
</head>
<body id="${escapeAttr(applicationId)}">${application}
    ${applicationAfter}
    ${bodyEnd}
</body>
</html>`;

export const getApplicationAfter = (store, dispatcher, {
    applicationId,
    hashEnabled,
    fullHash
}) => `<script>
    window.__RERENDER = {};
    window.__RERENDER.storeState = ${JSON.stringify(store.dehydrate())};
    window.__RERENDER.dispatcherState = ${JSON.stringify(dispatcher.dehydrate())};
    window.__RERENDER.settings = ${JSON.stringify({
        applicationId,
        hashEnabled,
        fullHash
    })};
</script>`;

export default defaultHtmlWrapper;
