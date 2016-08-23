import Component, { checkProps } from './Component';
import Events from './Events';
import { debug, escape, escapeHtml, getHash, isSameProps, nextTick } from './utils';
import { patch, diff } from 'virtual-dom';
import createElement from 'virtual-dom/create-element';
import h from 'virtual-dom/h';
import throttle from 'lodash/throttle';

var allInstances = {},
    mountedInstances = {},
    eventHandlers = {},
    refsDom = {},
    rerenderTrigger;

const PRIMITIVE_TYPES = {
        number: true,
        string: true,
        boolean: true
    },

    RENDER_THROTTLE = 50,

    ATTRS_TO_HTML = {
        className: 'class',
        dataset: true
    },

    EVENTS_ATTRS = {
        onClick: 'click',
        onMouseDown: 'mousedown',
        onMouseUp: 'mouseup',
        onChange: 'change',
        onKeyDown: 'keydown',
        onKeyUp: 'keyup',
        onFocus: 'focus',
        onBlur: 'blur',
        onInput: 'input',
        onSubmit: 'submit'
    },

    RERENDER_ATTRS = {
        onSetRef: 'refset'
    },

    SPECIAL_MEANING_ATTRS = Object.assign({}, EVENTS_ATTRS, RERENDER_ATTRS),

    RERENDER_TAG = 'instance',

    events = new Events(),

    createTreeItem = function({ component, props, children, options }) {
        let item = { component, props, children },
            { position } = options;

        if (isStateless(component)) {
            item.lastRender = component(props, children, options);
            debug.log(`Stateless component ${position} is rendered`);
        } else {
            item.instance = new component(props, children, options);
            Component.beforeRender(item.instance);
            item.lastRender = Component.render(item.instance);
            item.state = item.instance.state;
            debug.log(`Component ${position} is rendered`);
        }

        return item;
    },

    renderInstance = function({ attrs, children }, options) {
        let { position, nextMounted } = options,
            { of: component } = attrs,
            stateless = isStateless(component),
            { defaults } = component,
            props = Object.assign({}, defaults, attrs),
            isExists = !!allInstances[position],
            current;

        delete props.of;

        // TODO: undefined and null values are same type
        // multiple values (arrays of types), and describe subobjects
        // FIXME: must be disabled in PRODUCTION
        false && checkProps(props, component);

        if (isExists) {
            current = allInstances[position];
            let sameOuter = isSameProps(current.props, props) && children === current.children && component === current.component;

            if (stateless) {
                if (!sameOuter) {
                    current = createTreeItem({ component, props, children, options });
                }
            } else {
                Component.beforeRender(current.instance);

                if (!sameOuter || current.instance.state !== current.state || current.instance._forceRender) {
                    current.props = props;
                    current.children = children;
                    current.state = current.instance.state;
                    Component.setProps(current.instance, props, children);
                    current.lastRender = Component.render(current.instance);
                    debug.log(`Component ${position} is rerendered`);
                }
            }
        } else {
            current = createTreeItem({ component, props, children, options });
        }

        nextMounted[position] = current;

        return current.lastRender;
    },

    isStateless = function(component) {
        return !(component.prototype instanceof Component);
    },

    calcInstancePosition = function({ attrs: { of: component, key } }, { position }) {
        if (component.singleton) {
            return `__singletons__${component.name}`;
        } else {
            return `${position}${component.name}`;
        }
    },

    createNode = function({ tag, attrs = {}, children }, { nextEventHandlers, position }) {
        let attrsFiltered = Object.keys(attrs).reduce((memo, name) => {
            if (typeof attrs[name] === 'undefined' || attrs[name] === '') {
                return memo;
            }

            let eventType = SPECIAL_MEANING_ATTRS[name];

            if (!eventType) {
                memo[name] = attrs[name];
            } else {
                nextEventHandlers[eventType] = nextEventHandlers[eventType] || {};
                nextEventHandlers[eventType][position] = attrs[name];
            }

            return memo;
        }, {});

        return h(tag, attrsFiltered, children);
    },

    stringifyTag = function({ tag, attrs = {}, children }) {
        let attrsString = Object.keys(attrs).reduce((memo, name) => {
            if (typeof attrs[name] === 'undefined' || attrs[name] === '') {
                return memo;
            }

            if (ATTRS_TO_HTML[name]) {
                if (name === 'dataset') {
                    memo += Object.keys(attrs[name]).reduce((dataset, key) => {
                        dataset += ` data-${key}="${escape(attrs[name][key])}"`;

                        return dataset;
                    }, '');
                } else {
                    memo += ` ${ATTRS_TO_HTML[name]}="${escape(attrs[name])}"`;
                }
            } else if (!SPECIAL_MEANING_ATTRS[name]) {
                memo += ` ${name}="${escape(attrs[name])}"`;
            }

            return memo;
        }, '');

        // FIXME: tag inspections
        // TODO: implement selfclosed tags
        return `<${tag}${attrsString}>${children}</${tag}>`;
    },

    hasEventsHandlers = function(attrs = {}) {
        return Object.keys(attrs).some(key => !!SPECIAL_MEANING_ATTRS[key]);
    },

    // FIXME: recursive function => loops
    expand = function({ stringify, omitIds, vDom, store, nextEventHandlers, joinTextNodes, nextMounted = {} }) {

        return function curried(json, position = '') {
            if (Array.isArray(json)) {
                let expandedArray = json.map((item, index) => curried(item, `${position}.${item && (item.attrs || {}).key ? `k${item.attrs.key}` : index}`));
                // need for first render without replacing server result
                if (joinTextNodes) {
                    expandedArray = expandedArray.reduce((memo, item) => {
                        let lastIndex = memo.length - 1,
                            prevItem = memo[lastIndex];

                        if (typeof item === 'string' && typeof prevItem === 'string') {
                            memo[lastIndex] += item;
                        } else {
                            memo.push(item);
                        }

                        return memo;
                    }, []);
                }

                return stringify ? expandedArray.join('') : expandedArray;
            } else if (PRIMITIVE_TYPES[typeof json]) {
                return stringify ? escapeHtml(json) : json;
            } else if (typeof json === 'function') {
                return curried(json(), position);
            } else if (typeof json === 'object' && json.attrs && typeof json.attrs._ === 'object') {
                let attrs = Object.assign({}, json.attrs._, json.attrs);

                delete attrs._;
                Object.assign(json, { attrs });

                return curried(json, position);
            } else if (typeof json === 'object' && json.tag !== RERENDER_TAG) {
                let attrs = omitIds || !hasEventsHandlers(json.attrs)
                        ? json.attrs
                        : Object.assign({}, json.attrs, {
                            dataset: Object.assign({}, (json.attrs || {}).dataset, {
                                rrid: position
                            })
                        }),
                    item = {
                        tag: json.tag,
                        attrs,
                        children: curried(json.children, `${position}.0`)
                    };

                return stringify
                    ? stringifyTag(item)
                    : vDom
                        ? createNode(item, { position, nextEventHandlers })
                        : item;
            } else if (typeof json === 'object' && json.tag === RERENDER_TAG) {
                let instancePosition = calcInstancePosition(json, { position }),
                    options = {
                        store,
                        isDom: vDom,
                        position: instancePosition,
                        nextMounted
                    };

                return curried(renderInstance(json, options), `${instancePosition}.0`);
            } else {
                return '';
            }
        };
    },

    serverRender = function(json, { store, omitIds } = {}) {
        return expand({
            stringify: true,
            omitIds,
            store
        })(json);
    },

    attachEventHandlers = function(domNode, nextEventHandlers) {
        replaceEventHandlers(nextEventHandlers);

        Object.keys(EVENTS_ATTRS).forEach(propName => {
            let eventType = EVENTS_ATTRS[propName];

            domNode.addEventListener(eventType, event => {
                let eventHandlersOfType = eventHandlers[eventType];

                if (!eventHandlersOfType) {
                    return;
                }

                let synteticEvent = {
                        origin: event,
                        stopped: false,
                        stopPropagation() {
                            this.stopped = true;
                        },
                        preventDefault() {
                            this.prevented = true;
                        },
                        prevented: false,
                        target: event.target
                    },
                    currentNode = event.target;

                while (currentNode && currentNode !== domNode && !synteticEvent.stopped) {
                    let rrId = currentNode.dataset && currentNode.dataset.rrid;

                    if (rrId && eventHandlersOfType[rrId]) {
                        debug.log(`Triggered event ${eventType} on ${rrId}.`);

                        eventHandlersOfType[rrId](synteticEvent);
                    }

                    currentNode = currentNode.parentNode;
                }

                if (synteticEvent.prevented) {
                    event.preventDefault();
                }
            }, true);
        });
    },

    replaceEventHandlers = function(nextEventHandlers) {
        eventHandlers = nextEventHandlers;
    },

    setRefs = function(callbacks, domNode) {
        let nextRefsDom = {};

        domNode.querySelectorAll('[data-rrid]').forEach(node => {
            let position = node.dataset.rrid,
                callback = callbacks[position];

            if (!callback) {
                return;
            }

            if (refsDom[position] !== node) {
                callback(node);
            }

            nextRefsDom[position] = node;
        });

        refsDom = nextRefsDom;
    },

    unmount = function(nextMounted) {
        let start = performance.now();

        Object.keys(mountedInstances).forEach(position => {
            let next = nextMounted[position],
                prev = mountedInstances[position];

            if (next) {
                if (prev.instance) {
                    if (next.instance !== prev.instance) {
                        Component.unmount(prev.instance);
                        Component.destroy(prev.instance);
                    }
                }
            } else {
                if (prev.instance) {
                    Component.unmount(prev.instance);

                // stateless
                } else {
                    allInstances[position] = undefined;
                }
            }
        });

        debug.log(`Unmount took ${(performance.now() - start).toFixed(3)}ms`);
    },

    mount = function(nextMounted) {
        let start = performance.now();

        Object.keys(nextMounted).forEach(position => {
            let next = nextMounted[position],
                prev = mountedInstances[position];

            if (prev && prev.instance) {
                if (next.instance !== prev.instance) {
                    Component.mount(next.instance);
                    allInstances[position] = next;
                }
            } else {
                if (next.instance) {
                    Component.mount(next.instance);
                }

                allInstances[position] = next;
            }
        });

        mountedInstances = nextMounted;

        debug.log(`Mount took ${(performance.now() - start).toFixed(3)}ms`);
    },

    clearRerender = function() {
        if (rerenderTrigger) {
            clearTimeout(rerenderTrigger);
            rerenderTrigger = undefined;
        }
    },

    clientRender = function(json, domNode, { store = {} } = {}) {
        let start = performance.now();

        let nextEventHandlers = {},
            nextMounted = {},
            vDom = expand({
                vDom: true,
                store,
                joinTextNodes: true,
                nextEventHandlers,
                nextMounted
            })(json),
            endExpand = performance.now(),
            hash = domNode.dataset && domNode.dataset.hash,
            rootNode = createElement(vDom);

        if (hash && hash !== getHash(rootNode.outerHTML)) {
            debug.warn('Client initial html and server html don\'t match!');
            domNode.removeChild(domNode.firstChild);
            domNode.appendChild(rootNode);
        } else {
            rootNode = domNode.firstChild;
        }

        attachEventHandlers(domNode, nextEventHandlers);
        nextEventHandlers.refset && setRefs(nextEventHandlers.refset, domNode);
        mount(nextMounted);

        debug.log(`First expand took ${(endExpand - start).toFixed(3)}ms`);
        debug.log(`First render took ${(performance.now() - start).toFixed(3)}ms`);

        events.on('rerender', throttle(() => {
            clearRerender();
            debug.log('Rereder begin');
            let start = performance.now(),
                nextEventHandlers = {},
                nextMounted = {},
                nextVDom = expand({
                    vDom: true,
                    store,
                    nextEventHandlers,
                    nextMounted
                })(json),
                endExpand = performance.now();

            unmount(nextMounted);
            rootNode = patch(rootNode, diff(vDom, nextVDom));
            vDom = nextVDom;
            replaceEventHandlers(nextEventHandlers);
            nextEventHandlers.refset && setRefs(nextEventHandlers.refset, domNode);
            mount(nextMounted);

            debug.log(`Expand took ${(endExpand - start).toFixed(3)}ms`);
            debug.log(`Rerender took ${(performance.now() - start).toFixed(3)}ms`);
        }, RENDER_THROTTLE, { leading: true }));
    },

    scheduleUpdate = function({ position }) {
        debug.log('Schedule: ', position);
        if (!rerenderTrigger) {
            rerenderTrigger = nextTick(() => {
                debug.log('Rerender triggered by', position);
                events.emit('rerender');
            });
        }
    };

export { serverRender, clientRender, scheduleUpdate };
