import Events from './Events';
import Store from './Store';
import Dispatcher from './Dispatcher';
import { componentMount, componentUnmount, componentDestroy, componentUpdate } from './componentLifeCycle';
import createInitialPatch from './createInitialPatch';
import diff from './diff';
import { debug } from './debug';
import TemplateVSandbox from './TemplateVSandbox';
import Context from './Context';
import { VNODE, VTEXT, VCOMPONENT } from './types';
import { groupByIdComponents, groupByIdNodes } from './utils';
import { applicationId as defaultApplicationId } from './defaults';

var RENDER_THROTTLE = 16;

function renderClient(userTemplate, settings = {}) {
    var {
        window = self,
        applicationId = defaultApplicationId
    } = settings;
    var document = window.document;
    var {
        storeState,
        settings: serverSettings = {}
    } = window[`__RERENDER__${applicationId}`] || {};

    var {
        rootNode = document.getElementById(applicationId),
        store = new Store({ state: storeState }),
        dispatcher = new Dispatcher({ store }),
        hashEnabled = serverSettings.hashEnabled,
        fullHash = serverSettings.fullHash
    } = settings;

    var events = new Events();
    var rootTemplate = new TemplateVSandbox(rootNode, userTemplate);
    var config = {
        store,
        dispatcher,
        // events, rootTemplate, document, rootNode, virtualRoot need only inside renderClient file
        events,
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
    config.componentOptions = {
        dispatch: dispatcher.dispatch,
        getParent: getParent(config),
        events
    };
    var nextVirtualRoot = rootTemplate.render(config);
    var patch = createInitialPatch(nextVirtualRoot.childNodes[0], {
        nextNodesById: config.nextNodes,
        document
    });
    var serverHash = serverSettings.hash;

    if (!hashEnabled || !serverHash || serverHash !== config.hash) {
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
    var nextVirtualRoot = config.rootTemplate.render(config);
    var patch = diff(nextVirtualRoot.childNodes[0], config.virtualRoot.childNodes[0], {
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
    var component = config.components[id];
    var node = getFirstNode(component);
    var sandbox = new TemplateVSandbox(node.parentNode, component.componentTemplate);
    var nextSandboxNode = sandbox.render(config, new Context(component.context));
    var nodesById = groupByIdNodes(node, {});
    var options = {
        nodesById,
        nextNodesById: config.nextNodes,
        document
    };
    var nextNode = nextSandboxNode.childNodes[0];
    var patch = diff(nextNode, node, options);

    var components = groupByIdComponents(component, {});
    var unmounted = unmountOne(config.nextComponents, components);

    patch.apply();
    mount(config.mountComponents);
    update(config.updateComponents);

    var nextComponent = nextSandboxNode.childs[0];
    component.parent.childs[component.context.index] = nextComponent;
    node.parentNode.childNodes[node.context.domIndex] = nextNode;
    nextComponent.set('context', component.context);
    nextComponent.parent = component.parent;
    nextNode.parentNode = node.parentNode;

    var removedNodes = {};
    for (var id in nodesById) {
        if (!config.nextNodes[id]) {
            removedNodes[id] = nodesById[id];
        }
    }

    prepearConfigOne(config, unmounted, removedNodes);
}

function getFirstNode(node) {
    if (node.type === VNODE || node.type === VTEXT) {
        return node;
    }

    return getFirstNode(node.childs[0]);
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

function prepearConfigOne(config, unmounted, removedNodes) {
    for (var id in config.nextNodes) {
        config.nodes[id] = config.nextNodes[id];
    }
    for (var id in removedNodes) {
        delete config.nodes[id];
    }
    config.nextNodes = {};

    for (var id in config.nextComponents) {
        config.components[id] = config.nextComponents[id];
    }
    for (var id in unmounted) {
        delete config.components[id];
    }
    config.nextComponents = {};

    for (var id in config.nextDynamicNodes) {
        config.dynamicNodes[id] = config.nextDynamicNodes[id];
    }
    for (var id in removedNodes) {
        delete config.dynamicNodes[id];
    }
    config.nextDynamicNodes = {};

    config.nextDynamicNodes = {};
    config.mountComponents = {};
    config.updateComponents = {};
}

function listenEvents(config) {
    var throttleTimeout;
    var rerenderOneTimeout;
    var scheduled;
    var scheduledOneId;
    var { events, store } = config;

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
    for (var id in instances) {
        componentMount(instances[id]);
    }
}

function unmount(nextComponents, components) {
    for (var id in components) {
        if (components[id].type === VCOMPONENT
            && (!nextComponents[id] || nextComponents[id].componentType !== components[id].componentType)
        ) {
            var instance = components[id].ref;
            componentUnmount(instance);
            componentDestroy(instance);
        }
    }
}

function unmountOne(nextComponents, components) {
    var unmounted = {};

    for (var id in components) {
        if (components[id].type === VCOMPONENT
            && (!nextComponents[id] || nextComponents[id].componentType !== components[id].componentType)
        ) {
            var instance = components[id].ref;
            componentUnmount(instance);
            componentDestroy(instance);
            unmounted[components[id].id] = components[id];
        }
    }

    return unmounted;
}

function getParent(config) {
    return id => config.components[id] && config.components[id].parent;
}

function update(instances) {
    for (var id in instances) {
        componentUpdate(instances[id]);
    }
}

export default renderClient;
export { RENDER_THROTTLE };
