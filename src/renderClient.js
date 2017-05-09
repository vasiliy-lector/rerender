import Events from './Events';
import Component from './Component';
import Context from './Context';
import createInitialPatch from './createInitialPatch';
import diff from './diff';
import { throttle } from './utils';
import VRoot from './VRoot';
import { VCOMPONENT } from './types';

const RENDER_THROTTLE = 16;

function renderClient(rootTemplate, store, rootNode, { document } = {}) {
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
        parentNode: nextVirtualRoot,
        rootNode
    });
    nextVirtualRoot.setChilds([rootTemplate.render(config, context)]);

    const patch = createInitialPatch(nextVirtualRoot, {
        nextNodesById: config.nextNodes,
        document
    });
    patch.applyNormalize();

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
    let virtualRoot = prevVirtualRoot;

    return throttle(function() {
        const nextVirtualRoot = new VRoot();
        const config = {
            store,
            events,
            components,
            nextComponents: {},
            mountComponents: {},
            updateComponents: {},
            nodes,
            nextNodes: {}
        };
        const context = new Context({
            parentId: 'r',
            parentNodeId: 'r',
            index: 0,
            parentPosition: '',
            domIndex: 0,
            parent: nextVirtualRoot,
            parentNode: nextVirtualRoot,
            rootNode
        });
        nextVirtualRoot.setChilds([rootTemplate.render(config, context)]);

        const patch = diff(nextVirtualRoot, virtualRoot, {
            nextNodesById: config.nextNodes,
            nodesById: nodes,
            document
        });

        unmount(config.nextComponents, components);
        // TODO blur problem when moving component with focus
        patch.apply();
        mount(config.mountComponents);
        update(config.updateComponents);

        virtualRoot = nextVirtualRoot;
        nodes = config.nextNodes;
        components = config.nextComponents;
    }, RENDER_THROTTLE, { leading: true });
}

function mount(instances) {
    for (let id in instances) {
        Component.mount(instances[id]);
    }
}

function unmount(nextComponents, components) {
    for (let id in components) {
        if (components[id].type === VCOMPONENT
            && (!nextComponents[id] || nextComponents[id].componentType !== components[id].componentType)
        ) {
            const instance = components[id].instance;
            Component.unmount(instance);
            Component.destroy(instance);
        }
    }
}

function update(instances) {
    for (let id in instances) {
        Component.update(instances[id]);
    }
}

export default renderClient;
export { RENDER_THROTTLE };
