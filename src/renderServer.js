function renderServer(rootTemplate, store, { hashEnabled = true, fullHash = false } = {}) {
    return rootTemplate.renderToString({
        store,
        hashEnabled,
        fullHash,
        hash: 0
    });
}

export default renderServer;
