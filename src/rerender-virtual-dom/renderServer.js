function renderServer(rootTemplate, store) {
    return rootTemplate.render({
        store
    });
}

export default renderServer;
