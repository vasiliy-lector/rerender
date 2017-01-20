import { patch, diff } from 'virtual-dom';
import createElement from 'virtual-dom/create-element';
import Events from '../Events';
import Component from '../Component';
import { throttle } from '../utils';
import { createInstance } from './jsx';

const RENDER_THROTTLE = 50;

function renderClient(render, store, domNode) {
    const start = performance.now();
    const events = new Events();
    const instances = {};
    const nextInstances = {};
    const nextNewInstances = {};
    const jsx = createInstance({
        store,
        events,
        // FIXME
        // joinTextNodes: true,
        stringify: false,
        instances,
        nextInstances,
        nextNewInstances
    });
    const vDom = render({ jsx }).exec('__r__');

    let rootNode = createElement(vDom);
    // TODO check hashsum from server and use server markup
    domNode.innerHTML = '';
    domNode.appendChild(rootNode);
    mount(nextNewInstances);
    const end = performance.now();
    console.log('first render: ', (end - start).toFixed(3)); // eslint-disable-line no-console

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
        instances = nextInstances;
        // TODO blur problem when moving component with focus
        rootNode = patch(rootNode, diff(vDom, nextVDom));
        vDom = nextVDom;
        mount(nextNewInstances);
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
