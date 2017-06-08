import { escapeAttr, escapeHtml } from './utils';

export var eventDefaults = {
    cache: false,
    userIndependent: false,
    serverDisabled: false,
    clientDisabled: false
};

export var getWrapHeader = ({
    title,
    head,
    applicationId
}) => `<!DOCTYPE html>
<html>
<head>
    <title>${escapeHtml(title)}</title>
    ${head}
</head>
<body id="${escapeAttr(applicationId)}">`;

export var getWrapFooter = ({
    bodyEnd
}) => `${bodyEnd}
</body>
</html>`;

export var getApplicationAfter = ({
    store,
    applicationId,
    hashEnabled,
    hash,
    fullHash
}) => `<script>
    window.__RERENDER__${applicationId} = {};
    window.__RERENDER__${applicationId}.storeState = ${JSON.stringify(store.dehydrate())};
    window.__RERENDER__${applicationId}.settings = ${JSON.stringify({
        hashEnabled,
        fullHash,
        hash
    })};
</script>`;
