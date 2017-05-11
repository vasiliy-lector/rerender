function renderServer(rootTemplate, store, { hashEnabled = true, easyHash = true } = {}) {
    return rootTemplate.renderToString({
        store,
        hashEnabled,
        easyHash,
        hash: 0
    });
}

export default renderServer;
