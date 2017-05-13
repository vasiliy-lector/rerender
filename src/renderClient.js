import Events from './Events';
import { componentMount, componentUnmount, componentDestroy, componentUpdate } from './componentLifeCycle';
import Context from './Context';
import createInitialPatch from './createInitialPatch';
import diff from './diff';
import { debug } from './debug';
import { throttle } from './utils';
import VRoot from './VRoot';
import { VCOMPONENT } from './types';

const RENDER_THROTTLE = 16;

function renderClient(rootTemplate, store, rootNode, { document = self.document, hashEnabled = true, fullHash = false } = {}) {
    const events = new Events();
    const nextVirtualRoot = new VRoot(rootNode);
    const config = {
        store,
        events,
        components: {},
        nextComponents: {},
        mountComponents: {},
        updateComponents: {},
        nodes: {},
        nextNodes: {},
        dynamicNodes: {},
        nextDynamicNodes: {},
        hashEnabled,
        fullHash,
        hash: 0
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

    const patch = createInitialPatch(nextVirtualRoot.childNodes[0], {
        nextNodesById: config.nextNodes,
        document
    });

    const firstChild = rootNode.childNodes[0];
    const hash = firstChild && firstChild.getAttribute('data-rerender-hash');

    if (!hashEnabled || hash !== String(config.hash)) {
        hashEnabled && debug.warn('Server and client html do not match!');
        rootNode.innerHTML = '';
        patch.apply();
    } else {
        patch.applyNormalize();
    }

    mount(config.mountComponents);

    events.on('rerender', rerenderClient({
        rootTemplate,
        store,
        events,
        document,
        rootNode,
        prevNodes: config.nextNodes,
        prevComponents: config.nextComponents,
        prevVirtualRoot: nextVirtualRoot,
        prevDynamicNodes: config.nextDynamicNodes
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
    prevVirtualRoot,
    prevDynamicNodes
}) {
    let components = prevComponents;
    let nodes = prevNodes;
    let virtualRoot = prevVirtualRoot;
    let dynamicNodes = prevDynamicNodes;

    return throttle(function() {
        const nextVirtualRoot = new VRoot(rootNode);
        const config = {
            store,
            events,
            components,
            nextComponents: {},
            mountComponents: {},
            updateComponents: {},
            nodes,
            nextNodes: {},
            dynamicNodes,
            nextDynamicNodes: {}
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

        const patch = diff(nextVirtualRoot.childNodes[0], virtualRoot.childNodes[0], {
            nextNodesById: config.nextNodes,
            nodesById: nodes,
            document
        });

        unmount(config.nextComponents, components);
        const activeElement = document.activeElement;
        patch.apply();
        // FIXME: move inside patch? and problem not neccessary blur and focus event
        if (document.activeElement !== activeElement && activeElement.parentNode) {
            activeElement.focus();
        }
        mount(config.mountComponents);
        update(config.updateComponents);

        virtualRoot = nextVirtualRoot;
        nodes = config.nextNodes;
        components = config.nextComponents;
    }, RENDER_THROTTLE, { leading: true });
}

function mount(instances) {
    for (let id in instances) {
        componentMount(instances[id]);
    }
}

function unmount(nextComponents, components) {
    for (let id in components) {
        if (components[id].type === VCOMPONENT
            && (!nextComponents[id] || nextComponents[id].componentType !== components[id].componentType)
        ) {
            const instance = components[id].instance;
            componentUnmount(instance);
            componentDestroy(instance);
        }
    }
}

function update(instances) {
    for (let id in instances) {
        componentUpdate(instances[id]);
    }
}

export default renderClient;
export { RENDER_THROTTLE };
