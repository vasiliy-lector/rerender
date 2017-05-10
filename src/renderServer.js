function renderServer(rootTemplate, store, { hashEnabled = true } = {}) {
    return rootTemplate.renderToString({
        store,
        hashEnabled,
        hash: 0
    });
}

export default renderServer;
