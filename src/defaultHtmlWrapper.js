import { escapeAttr, escapeHtml } from './utils';

export default function defaultHtmlWrapper({
    title,
    head,
    applicationId,
    application,
    applicationAfter,
    bodyEnd
}) {
    return `<!DOCTYPE html>
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
}

export function getApplicationAfter(store, dispatcher) {
    return `<script>
        window.RERENDER_STORE_STATE = ${JSON.stringify(store.dehydrate())};
        window.RERENDER_DISPATCHER_STATE = ${JSON.stringify(dispatcher.dehydrate())};
    </script>`;
}
