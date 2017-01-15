import Events from './Events';
import Component from './Component';
import { throttle } from './utils';
import { createInstance } from './jsx';
import { patch, diff } from 'virtual-dom';
import createElement from 'virtual-dom/create-element';

const RENDER_THROTTLE = 50;

function renderClient(render, store, domNode) {
    const
        events = new Events(),
        instances = {},
        nextInstances = {},
        nextNewInstances = {},
        jsx = createInstance({
            store,
            events,
            // FIXME
            // joinTextNodes: true,
            stringify: false,
            instances,
            nextInstances,
            nextNewInstances
        }),
        vDom = render({ jsx }).exec('__r__');

    let rootNode = createElement(vDom);
    // TODO check hashsum from server and use server markup
    domNode.innerHTML = '';
    domNode.appendChild(rootNode);
    mount(nextNewInstances);

    events.on('rerender', rerenderClient({
        render,
        store,
        events,
        prevVDom: vDom,
        prevRootNode: rootNode,
        prevInstances: nextInstances
    }));
}

function rerenderClient({
    render,
    store,
    events,
    prevVDom,
    prevRootNode,
    prevInstances
}) {
    let instances = prevInstances,
        vDom = prevVDom,
        rootNode = prevRootNode;

    return throttle(function() {
        const nextInstances = {},
            nextNewInstances = {},
            jsx = createInstance({
                store,
                events,
                stringify: false,
                instances,
                nextInstances,
                nextNewInstances
            }),
            nextVDom = render({ jsx }).exec('__r__');
        unmount(instances);
        // TODO blur problem when moving component with focus
        rootNode = patch(rootNode, diff(vDom, nextVDom));
        vDom = nextVDom;
        mount(nextNewInstances);
    }, RENDER_THROTTLE, { leading: true });
}

function mount(nextNewInstances) {
    const keys = Object.keys(nextNewInstances);

    for (let i = 0, l = keys.length; i < l; i++) {
        Component.mount(nextNewInstances[keys[i]]);
    }
}

function unmount(instances) {
    const keys = Object.keys(instances);

    for (let i = 0, l = keys.length; i < l; i++) {
        let instance = instances[keys[i]];
        if (instance.type === 'Component') {
            // TODO singleton and key logic here (+ timelife static prop feature)
            Component.unmount(instance);
            Component.destroy(instance);
        }
    }
}

function renderServer(render, store) {
    const jsx = createInstance({
        store,
        stringify: true
    });

    return render({ jsx }).exec('__r__');
}

export { renderClient, renderServer, RENDER_THROTTLE };
