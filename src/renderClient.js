import Events from './Events';
import { componentMount, componentUnmount, componentDestroy, componentUpdate } from './componentLifeCycle';
import createInitialPatch from './createInitialPatch';
import diff from './diff';
import { debug } from './debug';
import TemplateVSandbox from './TemplateVSandbox';
import { VCOMPONENT } from './types';

const RENDER_THROTTLE = 16;

function renderClient(userTemplate, store, rootNode, {
    document = self.document,
    hashEnabled = true,
    fullHash = false
} = {}) {
    const events = new Events();
    const rootTemplate = new TemplateVSandbox(rootNode, userTemplate);
    const config = {
        store,
        events,
        // rootTemplate, document, rootNode, virtualRoot need only inside renderClient file
        rootTemplate,
        document,
        rootNode,
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
    const nextVirtualRoot = rootTemplate.render(config);
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

    config.hashEnabled = false;
    config.hash = undefined;
    config.fullHash = undefined;
    config.virtualRoot = nextVirtualRoot;
    prepearConfig(config);

    listenEvents(config);
}

function rerenderClient(config) {
    const nextVirtualRoot = config.rootTemplate.render(config);
    const patch = diff(nextVirtualRoot.childNodes[0], config.virtualRoot.childNodes[0], {
        nextNodesById: config.nextNodes,
        nodesById: config.nodes,
        document
    });

    unmount(config.nextComponents, config.components);
    patch.apply();
    mount(config.mountComponents);
    update(config.updateComponents);

    config.virtualRoot = nextVirtualRoot;
    prepearConfig(config);
}

function rerenderClientOne(config, id) {
    const nextVirtualRoot = config.components[id].componentTemplate.render(config, context);
    const patch = diff(nextVirtualRoot.childNodes[0], config.virtualRoot.childNodes[0], {
        nextNodesById: config.nextNodes,
        nodesById: config.nodes,
        document
    });

    unmount(config.nextComponents, config.components);
    patch.apply();
    mount(config.mountComponents);
    update(config.updateComponents);

    config.virtualRoot = nextVirtualRoot;
    prepearConfig(config);
}

function prepearConfig(config) {
    config.nodes = config.nextNodes;
    config.nextNodes = {};
    config.components = config.nextComponents;
    config.nextComponents = {};
    config.dynamicNodes = config.nextDynamicNodes;
    config.nextDynamicNodes = {};
    config.mountComponents = {};
    config.updateComponents = {};
}

function listenEvents(config) {
    let throttleTimeout;
    let rerenderOneTimeout;
    let scheduled;
    let scheduledOneId;
    const { events, store } = config;

    events.on('rerender', () => {
        if (scheduled) {
            return;
        }
        if (scheduledOneId) {
            clearTimeout(rerenderOneTimeout);
            scheduledOneId = undefined;
        }

        if (throttleTimeout === undefined) {
            setTimeout(() => {
                rerenderClient(config);
                scheduled = false;
            }, 0);

            throttleTimeout = setTimeout(() => {
                throttleTimeout = undefined;
                if (scheduled) {
                    rerenderClient(config);
                    scheduled = false;
                }
            }, RENDER_THROTTLE);
        }

        scheduled = true;
    });

    store.on('change', () => events.emit('rerender'));

    events.on('rerender-one', id => {
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
                rerenderClientOne(config, id);
                scheduledOneId = undefined;
            }, 0);
            scheduledOneId = id;
        } else {
            events.emit('rerender');
        }
    });
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
