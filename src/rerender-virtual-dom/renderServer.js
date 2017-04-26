function renderServer(rootTemplate, store) {
    return rootTemplate.stringify({
        store
    });
}

export default renderServer;
