import Events from './Events';
import Component from './Component';
import Context from './Context';
// TODO
import { createNormalizePatch, diff } from './patch';
import { throttle } from '../utils';
import { debug } from '../debug';
import createElement from '../virtualDom/createElement';
import VRoot from './VRoot';

const RENDER_THROTTLE = 16;

function renderClient(rootTemplate, store, rootNode, { document = self.document } = {}) {
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
    const root = new VRoot();
    const context = new Context({
        parentId: 'r',
        parentNodeId: 'r',
        index: 0,
        parentPosition: '',
        domIndex: 0,
        parent: root,
        parentNode: root
    });
    // const start = performance.now();
    const nextVirtualDom = rootTemplate.render(config, context);
    const nextFirstChild = createElement(root.childNodes[0], document);
    const firstChild = rootNode.childNodes[0];

    const normalizePatch = createNormalizePatch(config.nextNodes);

    if (!firstChild) {
        rootNode.appendChild(nextFirstChild);
    } else if (firstChild.outerHTML !== nextFirstChild.outerHTML) {
        debug.warn('Server and client html do not match!');
        rootNode.replaceChild(nextFirstChild, firstChild);
    } else {
        normalizePatch.apply(rootNode, document);
    }
    normalizePatch.applySetRefs();
    // const end = performance.now();
    // debug.log((end - start).toFixed(3), 'ms');

    mount(config.mountComponents);

    config.events.on('rerender', rerenderClient({
        rootTemplate,
        store,
        events,
        rootNode,
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
    rootNode,
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
