import Events from './Events';
import { componentMount, componentUnmount, componentDestroy, componentUpdate } from './componentLifeCycle';
import Context from './Context';
import createInitialPatch from './createInitialPatch';
import diff from './diff';
import { debug } from './debug';
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
        parentId: '',
        parentNodeId: '',
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

    const rerenderConfig = {
        rootTemplate,
        store,
        events,
        document,
        rootNode,
        nodes: config.nextNodes,
        components: config.nextComponents,
        virtualRoot: nextVirtualRoot,
        dynamicNodes: config.nextDynamicNodes
    };

    listenEvents(rerenderConfig);
}

function listenEvents(rerenderConfig) {
    let throttleTimeout;
    let rerenderOneTimeout;
    let scheduled;
    let scheduledOneId;

    rerenderConfig.events.on('rerender', () => {
        if (scheduled) {
            return;
        }
        if (scheduledOneId) {
            clearTimeout(rerenderOneTimeout);
            scheduledOneId = undefined;
        }

        if (throttleTimeout === undefined) {
            setTimeout(() => {
                rerenderClient(rerenderConfig);
                scheduled = false;
            }, 0);

            throttleTimeout = setTimeout(() => {
                throttleTimeout = undefined;
                if (scheduled) {
                    rerenderClient(rerenderConfig);
                    scheduled = false;
                }
            }, RENDER_THROTTLE);
        }

        scheduled = true;
    });

    rerenderConfig.store.on('change', () => rerenderConfig.events.emit('rerender'));

    rerenderConfig.events.on('rerender-one', id => {
        if (scheduled || scheduledOneId === id
            || (scheduledOneId && scheduledOneId.length < id.length && id.indexOf(scheduledOneId) !== -1)) {
            return;
        }

        if (scheduledOneId && id.length < scheduledOneId.length && scheduledOneId.indexOf(id) !== -1) {
            scheduledOneId = id;
            return;
        }

        if (!scheduledOneId) {
            rerenderOneTimeout = setTimeout(() => {
                rerenderClient(rerenderConfig, id);
                scheduledOneId = undefined;
            }, 0);
            scheduledOneId = id;
        } else {
            rerenderConfig.events.emit('rerender');
        }
    });
}

function rerenderClient(rerenderConfig, id) {
    const nextVirtualRoot = new VRoot(rerenderConfig.rootNode);
    const config = {
        store: rerenderConfig.store,
        events: rerenderConfig.events,
        components: rerenderConfig.components,
        nextComponents: {},
        mountComponents: {},
        updateComponents: {},
        nodes: rerenderConfig.nodes,
        nextNodes: {},
        dynamicNodes: rerenderConfig.dynamicNodes,
        nextDynamicNodes: {}
    };
    const context = new Context({
        parentId: '',
        parentNodeId: '',
        index: 0,
        parentPosition: '',
        domIndex: 0,
        parent: nextVirtualRoot,
        parentNode: nextVirtualRoot,
        rootNode: rerenderConfig.rootNode
    });
    nextVirtualRoot.setChilds([rerenderConfig.rootTemplate.render(config, context)]);

    const patch = diff(nextVirtualRoot.childNodes[0], rerenderConfig.virtualRoot.childNodes[0], {
        nextNodesById: config.nextNodes,
        nodesById: rerenderConfig.nodes,
        document
    });

    unmount(config.nextComponents, rerenderConfig.components);
    const activeElement = document.activeElement;
    patch.apply();
    // FIXME: move inside patch? and problem not neccessary blur and focus event
    if (document.activeElement !== activeElement && activeElement.parentNode) {
        activeElement.focus();
    }
    mount(config.mountComponents);
    update(config.updateComponents);

    rerenderConfig.virtualRoot = nextVirtualRoot;
    rerenderConfig.nodes = config.nextNodes;
    rerenderConfig.components = config.nextComponents;
    rerenderConfig.dynamicNodes = config.nextDynamicNodes;
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
