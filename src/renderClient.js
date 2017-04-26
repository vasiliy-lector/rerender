import Events from './Events';
import Component from './Component';
import Context from './Context';
// TODO
import { createNormalizePatch, diff } from './patch';
import { throttle } from '../utils';
import { debug } from '../debug';
import createElement from '../virtualDom/createElement';

const RENDER_THROTTLE = 16;

function renderClient(rootTemplate, store, domNode, { document = self.document } = {}) {
    const events = new Events();
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
    const context = new Context();
    // const start = performance.now();
    const nextVirtualDom = rootTemplate.render(config, context);
    const nextFirstChild = createElement(findRootDomNode(nextVirtualDom), document);
    const firstChild = domNode.childNodes[0];

    const normalizePatch = createNormalizePatch(config.nextNodes);

    if (!firstChild) {
        domNode.appendChild(nextFirstChild);
    } else if (firstChild.outerHTML !== nextFirstChild.outerHTML) {
        debug.warn('Server and client html do not match!');
        domNode.replaceChild(nextFirstChild, firstChild);
    } else {
        normalizePatch.apply(domNode, document);
    }
    normalizePatch.applySetRefs();
    // const end = performance.now();
    // debug.log((end - start).toFixed(3), 'ms');

    mount(config.mountComponents);

    config.events.on('rerender', rerenderClient({
        rootTemplate,
        store,
        events,
        domNode,
        prevNodes: config.nextNodes,
        prevComponents: config.nextComponents,
        prevVirtualDom: nextVirtualDom,
        document
    }));
}

function rerenderClient({
    rootTemplate,
    store,
    events,
    document,
    domNode,
    prevNodes,
    prevComponents,
    prevVirtualDom
}) {
    let components = prevComponents;
    let nodes = prevNodes;
    let virtualDom = prevVirtualDom;

    return throttle(function() {
        const config = {
            store,
            events,
            nextComponents: {},
            mountComponents: {},
            updateComponents: {},
            nextNodes: {},
            nodes,
            components,
            virtualDom: virtualDom
        };

        const context = new Context();
        virtualDom = rootTemplate.render(config, context);

        // TODO: find unmount instances in components vs nextComponents
        unmount(config.unmountComponents);
        nodes = config.nextNodes;
        components = config.nextComponents;
        const patch = diff(config.nodes, config.nextNodes);

        // TODO blur problem when moving component with focus
        patch.apply(domNode, document);
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

// FIXME
function findRootDomNode(virtualDom) {
    return virtualDom;
}

export default renderClient;
export { RENDER_THROTTLE };
