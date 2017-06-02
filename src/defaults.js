import { escapeAttr, escapeHtml } from './utils';

export const eventDefaults = {
    cache: false,
    userIndependent: false,
    serverDisabled: false,
    clientDisabled: false
};

export const defaultHtmlWrapper = ({
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

export const getApplicationAfter = ({
    store,
    applicationId,
    hashEnabled,
    fullHash
}) => `<script>
    window.__RERENDER__${applicationId} = {};
    window.__RERENDER__${applicationId}.storeState = ${JSON.stringify(store.dehydrate())};
    window.__RERENDER__${applicationId}.settings = ${JSON.stringify({
        hashEnabled,
        fullHash
    })};
</script>`;
