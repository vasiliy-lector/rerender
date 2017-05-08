import Events from './Events';
import Component from './Component';
import Context from './Context';
import diff from './diff';
import { throttle } from '../utils';
import VRoot from './VRoot';

const RENDER_THROTTLE = 16;

function renderClient(rootTemplate, store, rootNode, { document = self.document } = {}) {
    const events = new Events();
    const nextVirtualRoot = new VRoot();
    const config = {
        store,
        events,
        components: {},
        nextComponents: {},
        mountComponents: {},
        updateComponents: {},
        nodes: {},
        nextNodes: {}
    };
    const context = new Context({
        parentId: 'r',
        parentNodeId: 'r',
        index: 0,
        parentPosition: '',
        domIndex: 0,
        parent: nextVirtualRoot,
        parentNode: nextVirtualRoot
    });
    nextVirtualRoot.setChilds([rootTemplate.render(config, context)]);

    const patch = diff(nextVirtualRoot, new VRoot(), {
        nextNodesById: config.nextNodes,
        nodesById: {}
    });
    patch.apply(rootNode, document);

    mount(config.mountComponents);

    events.on('rerender', rerenderClient({
        rootTemplate,
        store,
        events,
        rootNode,
        prevNodes: config.nextNodes,
        prevComponents: config.nextComponents,
        prevVirtualRoot: nextVirtualRoot,
        document
    }));
}

function rerenderClient({
    rootTemplate,
    store,
    events,
    document,
    rootNode,
    prevNodes,
    prevComponents,
    prevVirtualRoot
}) {
    let components = prevComponents;
    let nodes = prevNodes;
    let virtualDom = prevVirtualRoot;

    return throttle(function() {
        const config = {
            store,
            events,
            nextComponents: {},
            mountComponents: {},
            updateComponents: {},
            nextNodes: {},
            nodes,
            components
        };

        const context = new Context();
        virtualDom = rootTemplate.render(config, context);

        // TODO: find unmount instances in components vs nextComponents
        unmount(config.unmountComponents);
        nodes = config.nextNodes;
        components = config.nextComponents;
        const patch = diff(config.nodes, config.nextNodes);

        // TODO blur problem when moving component with focus
        patch.apply(rootNode, document);
        update(config.updateComponents);
        mount(config.mountComponents);
    }, RENDER_THROTTLE, { leading: true });
}

function mount(instances) {
    for (let id in instances) {
        Component.mount(instances[id]);
    }
}

function unmount(instances) {
    for (let id in instances) {
        const instance = instances[id];
        Component.unmount(instance);
        Component.destroy(instance);
    }
}

// FIXME
function update() {}

export default renderClient;
export { RENDER_THROTTLE };
