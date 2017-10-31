import { escapeAttr, escapeHtml } from './utils';
import { HeaderOptions, FooterOptions, ApplicationOptions } from './types';

export const eventDefaults = {
    cache: false,
    single: false,
    crossUser: false,
    serverDisabled: false,
    serverCacheAge: 600000
};

export const getWrapHeader: (options: HeaderOptions) => string = ({
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

export const getWrapFooter: (options: FooterOptions) => string = ({
    bodyEnd
}) => `${bodyEnd}
</body>
</html>`;

export const defaultApplicationId = 'rerenderApplication';

export const getApplicationAfter: (options: ApplicationOptions) => string = ({
    dispatcherCache,
    applicationId = defaultApplicationId,
    hashEnabled,
    eventDefaults: eventDefaultsFromOptions = {},
    hash,
    fullHash
}) => `<script>
    window.__RERENDER__${applicationId} = {};
    window.__RERENDER__${applicationId}.dispatcherCache = ${JSON.stringify(dispatcherCache)};
    window.__RERENDER__${applicationId}.eventDefaults = ${JSON.stringify(eventDefaultsFromOptions)};
    window.__RERENDER__${applicationId}.settings = ${JSON.stringify({
        hashEnabled,
        fullHash,
        hash
    })};
</script>`;
