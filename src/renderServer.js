function renderServer(rootTemplate, store) {
    return rootTemplate.renderToString({
        store
    });
}

export default renderServer;
