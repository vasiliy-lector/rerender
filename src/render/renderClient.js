import createElement from '../dom/createElement';
import Events from '../Events';
import Component from '../Component';
import { throttle } from '../utils';
import { createInstance } from './jsx';

const RENDER_THROTTLE = 16,
    ROOT_POSITION = 'r';

function renderClient(render, store, domNode, { document = self.document } = {}) {
    let vDom;
    let rootNode;
    const events = new Events();
    const instances = {};
    const nextInstances = {};
    const nextNewInstances = {};
    const cachedNodes = {};
    const nextCachedNodes = {};
    const jsx = createInstance({
        store,
        events,
        method: 'create',
        instances,
        nextInstances,
        cachedNodes,
        nextCachedNodes,
        nextNewInstances
    });
    // const start = performance.now();
    vDom = render({ jsx }).exec(ROOT_POSITION);
    // const checkSum = domNode.getAttribute('data-rerender-checksum');
    // true check
    rootNode = createElement(vDom);
    domNode.innerHTML = '';
    domNode.appendChild(rootNode);
    // const end = performance.now();
    // console.log((end - start).toFixed(3), 'ms'); // eslint-disable-line no-console

    mount(nextNewInstances);

    events.on('rerender', rerenderClient({
        render,
        store,
        events,
        prevVDom: vDom,
        prevRootNode: rootNode,
        prevCachedNodes: nextCachedNodes,
        prevInstances: nextInstances
    }));
}

function rerenderClient({
    render,
    store,
    events,
    prevVDom,
    prevCachedNodes,
    prevRootNode,
    prevInstances
}) {
    let instances = prevInstances;
    let vDom = prevVDom;
    let cachedNodes = prevCachedNodes;
    let rootNode = prevRootNode;
    const config = {
        store,
        events,
        method: 'diff'
    };
    const jsx = createInstance(config);

    return throttle(function() {
        config.nextInstances = {};
        config.nextNewInstances = {};
        config.nextCachedNodes = {};
        config.cachedNodes = cachedNodes;
        config.instances = instances;
        const nextVDom = render({ jsx }).exec(ROOT_POSITION);

        unmount(instances);
        cachedNodes = config.nextCachedNodes;
        instances = config.nextInstances;
        // TODO blur problem when moving component with focus
        // rootNode = patch(rootNode, diff(vDom, nextVDom));
        vDom = nextVDom;
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
