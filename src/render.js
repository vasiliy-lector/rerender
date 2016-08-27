import Component from './Component';
import checkProps from './checkProps';
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
    rerenderTrigger,
    delayedEvents = {},
    rerenderNow = false,
    ids = {},
    positionsById = {},
    nextShortId = 0;

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

    DELAY_EVENTS = {
        'focus': true,
        'blur': true
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
        onReset: 'reset',
        onInput: 'input',
        onSubmit: 'submit'
    },

    RECOVER_TAGS = {
        input: true,
        select: true,
        option: true,
        textarea: true
    },

    SPECIAL_MEANING_ATTRS = {
        ref: true
    },

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

    createNode = function({ tag, attrs = {}, children }, { nextEventHandlers, refCallbacks, position }) {
        let attrsFiltered = Object.keys(attrs).reduce((memo, name) => {
            if (typeof attrs[name] === 'undefined' || attrs[name] === '') {
                return memo;
            }

            let eventType = EVENTS_ATTRS[name];

            if (eventType) {
                nextEventHandlers[eventType] = nextEventHandlers[eventType] || {};
                nextEventHandlers[eventType][position] = attrs[name];
            } else if (name === 'ref') {
                refCallbacks[position] = attrs[name];
            } else {
                memo[name] = attrs[name];
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
            } else if (!EVENTS_ATTRS[name] && !SPECIAL_MEANING_ATTRS[name]) {
                memo += ` ${name}="${escape(attrs[name])}"`;
            }

            return memo;
        }, '');

        // FIXME: tag inspections
        // TODO: implement selfclosed tags
        return `<${tag}${attrsString}>${children}</${tag}>`;
    },

    // hasEventsHandlers = function(attrs = {}) {
    //     return Object.keys(attrs).some(key => !!EVENTS_ATTRS[key]);
    // },
    //
    // FIXME: recursive function => loops
    expand = function({ stringify, omitIds, vDom, store, refCallbacks, nextEventHandlers, joinTextNodes, nextMounted = {} }) {

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
                let attrs = getAttrsWithDataset(json, { omitIds, position }),
                    item = {
                        tag: json.tag,
                        attrs,
                        children: curried(json.children, `${position}.0`)
                    };

                return stringify
                    ? stringifyTag(item)
                    : vDom
                        ? createNode(item, { position, refCallbacks, nextEventHandlers })
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

    getShortId = function(position) {
        if (!ids[position]) {
            ids[position] = nextShortId;
            positionsById[nextShortId] = position;
            nextShortId++;
        }

        return ids[position];
    },

    getAttrsWithDataset = function(json, { omitIds, position }) {
        let { tag, attrs = {} } = json;

        if (omitIds) {
            return attrs;
        }

        let { dataset } = attrs,
            nextDataset = Object.assign({}, dataset);

        nextDataset.rrid = getShortId(position);
        // if (hasEventsHandlers(json)) {
        //     nextDataset.rrid = position;
        // }

        if (attrs.ref) {
            nextDataset.rrref = true;
        }

        if (RECOVER_TAGS[tag]) {
            nextDataset.rruser = true;
        }

        return Object.assign({}, attrs, {
            dataset: nextDataset
        });
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
                if (rerenderNow && DELAY_EVENTS[eventType]) {
                    delayedEvents[eventType] = {
                        event,
                        eventType,
                        eventHandlers: eventHandlers[eventType]
                    };
                }

                executeCallbacks({
                    domNode,
                    event,
                    eventType,
                    eventHandlers: eventHandlers[eventType]
                });
            }, true);
        });
    },

    executeCallbacks = function({ domNode, event, eventType, eventHandlers }) {
        if (!eventHandlers) {
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
            let rrId = currentNode.dataset && currentNode.dataset.rrid,
                position = positionsById[rrId];

            if (position && eventHandlers[position]) {
                debug.log(`Triggered event ${eventType} on ${position}.`);
                eventHandlers[position](synteticEvent);
            }

            currentNode = currentNode.parentNode;
        }

        if (synteticEvent.prevented) {
            event.preventDefault();
        }
    },

    replaceEventHandlers = function(nextEventHandlers) {
        eventHandlers = nextEventHandlers;
    },

    setRefs = function(callbacks, domNode) {
        let nextRefsDom = {};

        domNode.querySelectorAll('[rrref]').forEach(node => {
            let id = node.dataset.rrid,
                position = positionsById[id],
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

    clearTrigger = function() {
        if (rerenderTrigger) {
            clearTimeout(rerenderTrigger);
            rerenderTrigger = undefined;
        }
    },

    clientRender = function(json, domNode, { store = {} } = {}) {
        let start = performance.now();

        let nextEventHandlers = {},
            refCallbacks = {},
            nextMounted = {},
            vDom = expand({
                vDom: true,
                store,
                joinTextNodes: true,
                nextEventHandlers,
                refCallbacks,
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

        refCallbacks && setRefs(refCallbacks, domNode);
        attachEventHandlers(domNode, nextEventHandlers);
        mount(nextMounted);

        debug.log(`First expand took ${(endExpand - start).toFixed(3)}ms`);
        debug.log(`First render took ${(performance.now() - start).toFixed(3)}ms`);

        events.on('rerender', throttle(() => {
            clearTrigger();
            debug.log('Rereder begin');
            let start = performance.now(),
                nextEventHandlers = {},
                refCallbacks = {},
                nextMounted = {},
                nextVDom = expand({
                    vDom: true,
                    store,
                    nextEventHandlers,
                    refCallbacks,
                    nextMounted
                })(json),
                endExpand = performance.now();

            unmount(nextMounted);
            turnOnDelay();
            rootNode = patch(rootNode, diff(vDom, nextVDom));
            vDom = nextVDom;
            turnOffDelay(domNode);
            refCallbacks && setRefs(refCallbacks, domNode);
            replaceEventHandlers(nextEventHandlers);
            mount(nextMounted);

            debug.log(`Expand took ${(endExpand - start).toFixed(3)}ms`);
            debug.log(`Rerender took ${(performance.now() - start).toFixed(3)}ms`);
        }, RENDER_THROTTLE, { leading: true }));
    },

    turnOnDelay = function() {
        rerenderNow = true;
    },

    // blur and focus fix
    turnOffDelay = function(domNode) {
        if (delayedEvents.blur && !delayedEvents.focus) {
            const {
                    event: {
                        target: prevFocusNode
                    }
                } = delayedEvents.blur,
                {
                    dataset: {
                        rrid: prevFocusId
                    }
                } = prevFocusNode,
                nextFocusNode = typeof prevFocusId !== 'undefined' && domNode.querySelectorAll(`[data-rrid="${prevFocusId}"]`)[0];

            if (nextFocusNode) {
                repairFocusAndSelection(nextFocusNode, prevFocusNode);
            } else {
                executeCallbacks(Object.assign({ domNode }, delayedEvents.blur));
            }
        }

        rerenderNow = false;

        if (delayedEvents.blur && delayedEvents.focus) {
            const {
                    event: {
                        target: prevFocusNode
                    }
                } = delayedEvents.focus,
                {
                    dataset: {
                        rrid: prevFocusId
                    }
                } = prevFocusNode,
                nextFocusNode = typeof prevFocusId !== 'undefined' && domNode.querySelectorAll(`[data-rrid="${prevFocusId}"]`)[0];

            if (nextFocusNode) {
                if (nextFocusNode !== prevFocusNode) {
                    repairFocusAndSelection(nextFocusNode, prevFocusNode);
                } else {
                    executeCallbacks(Object.assign({ domNode }, delayedEvents.focus));
                }
            }
        }

        delayedEvents = {};
    },

    repairFocusAndSelection = function(node, prev) {
        node.focus();

        if (typeof prev.selectionStart !== 'undefined') {
            const { selectionStart, selectionEnd, selectionDirection = 'none' } = prev;

            node.setSelectionRange(selectionStart, selectionEnd, selectionDirection);
        }
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
