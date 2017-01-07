function renderComponent({ store, stringify }) {
    if (stringify) {
        return renderComponentToString(store);
    } else {
        return renderComponentToVDom(store);
    }
}

function renderComponentToString(store) {
    return function(tag, attrs, children) {
        return {
            tag,
            attrs,
            children
        };
    };
}

function renderComponentToVDom(store) {
    return function(tag, attrs, children) {
        return {
            tag,
            attrs,
            children
        };
    };
}

export default renderComponent;
