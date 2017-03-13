import Events from '../Events';
import Component from '../Component';
import Position from './Position';
import Patch from './Patch';
import { throttle } from '../utils';
import { debug } from '../debug';
import { createInstance } from './jsx';
import createElement from './virtualDom/createElement';

const RENDER_THROTTLE = 16,
    ROOT_POSITION = new Position('r', undefined, '', -1);

function renderClient(render, store, domNode, { document = self.document } = {}) {
    const events = new Events();
    const instances = {};
    const nextInstances = {};
    const nextNewInstances = {};
    const nodes = {};
    const nextNodes = {};
    const cacheByValues = {};
    const nextCacheByValues = {};
    const patch = new Patch(domNode, document);
    const jsx = createInstance({
        store,
        events,
        method: 'create',
        patch,
        instances,
        nextInstances,
        nextNewInstances,
        nodes,
        nextNodes,
        cacheByValues,
        nextCacheByValues,
        document
    });
    // const start = performance.now();
    const nextVirtualDom = render({ jsx }).exec(ROOT_POSITION);
    const nextRootNode = createElement(nextVirtualDom, document);
    const rootNode = domNode.childNodes[0];

    if (rootNode.outerHTML !== nextRootNode.outerHTML) {
        debug.warn('Server and client html do not match!');
        domNode.replaceChild(rootNode, nextRootNode);
    } else {
        patch.applyNormalize();
    }
    patch.applySetRefs();
    // const end = performance.now();
    // debug.log((end - start).toFixed(3), 'ms');

    mount(nextNewInstances);

    events.on('rerender', rerenderClient({
        render,
        store,
        events,
        domNode,
        prevNodes: nextNodes,
        prevInstances: nextInstances,
        prevCacheByValues: nextCacheByValues,
        prevVirtualDom: nextVirtualDom,
        document
    }));
}

function rerenderClient({
    render,
    store,
    events,
    document,
    domNode,
    prevNodes,
    prevInstances,
    prevVirtualDom,
    prevCacheByValues
}) {
    let instances = prevInstances;
    let nodes = prevNodes;
    let cacheByValues = prevCacheByValues;
    let virtualDom = prevVirtualDom;
    const config = {
        store,
        events,
        document,
        method: 'diff'
    };
    const jsx = createInstance(config);

    return throttle(function() {
        config.nextInstances = {};
        config.nextNewInstances = {};
        config.nextNodes = {};
        config.nodes = nodes;
        config.instances = instances;
        config.cacheByValues = cacheByValues;
        config.virtualDom = virtualDom;
        config.nextCacheByValues = {};
        config.patch = new Patch(domNode, document);

        virtualDom = render({ jsx }).exec(ROOT_POSITION);

        for (let id in config.nodes) {
            config.patch.remove(config.nodes[id].position.getPosition());
        }

        unmount(instances);
        nodes = config.nextNodes;
        instances = config.nextInstances;
        cacheByValues = config.nextCacheByValues;
        // TODO blur problem when moving component with focus
        config.patch.apply();
        mount(config.nextNewInstances);
    }, RENDER_THROTTLE, { leading: true });
}

function mount(instances) {
    const keys = Object.keys(instances);

    for (let i = 0, l = keys.length; i < l; i++) {
        Component.mount(instances[keys[i]]);
    }
}

function unmount(instances) {
    const keys = Object.keys(instances);

    for (let i = 0, l = keys.length; i < l; i++) {
        let instance = instances[keys[i]];
        if (instance.type === 'Component') {
            // TODO singleton and uniqid logic here (+ timelife static prop feature)
            Component.unmount(instance);
            Component.destroy(instance);
        }
    }
}

export default renderClient;
