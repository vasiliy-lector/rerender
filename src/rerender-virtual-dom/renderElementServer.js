export default function renderElementServer(tag) {
    if (typeof tag === 'string') {
        return renderTagServer(arguments);
    } else {
        return renderComponentServer(arguments);
    }
}

function renderTagServer() {
    return null;
}

function renderComponentServer() {
    return null;
}
