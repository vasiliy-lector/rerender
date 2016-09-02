import Component from './Component';
import Events from './Events';
import { debug, escape, escapeHtml, getHash, isSameProps, nextTick } from './utils';
import { patch, diff } from 'virtual-dom';
import createElement from 'virtual-dom/create-element';
import h from 'virtual-dom/h';
import throttle from 'lodash/throttle';


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

    SUPPORT_SELECTION_INPUT_TYPES = {
        text: true,
        search: true,
        URL: true,
        url: true,
        tel: true,
        password: true
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

    events = new Events();

let rerenderTrigger;

class RenderController {
    constructor({ json, domNode, options = {} }) {

        this.domNode = domNode;
        this.store = options.store;
        this.options = options;
        this.allInstances = {};
        this.mountedInstances = {};
        this.eventHandlers = {};
        this.refsDom = {};
        this.delayedEvents = {};
        this.rerenderNow = false;
        this.ids = {};
        this.positionsById = {};
        this.nextShortId = 0;

        if (!options.isServer) {
            this.clientInit(json);
        }
    }

    clientInit(json) {
        const { domNode, store } = this;

        let start = performance.now();

        let nextEventHandlers = {},
            refCallbacks = {},
            nextMounted = {},
            vDom = this.expand({
                joinTextNodes: true,
                nextEventHandlers,
                refCallbacks,
                nextMounted
            })(json),
            endExpand = performance.now(),
            hash = domNode.dataset && domNode.dataset.hash,
            rootNode = createElement(vDom, { document: this.options.document });

        if (!hash) {
            domNode.innerHTML = rootNode.outerHTML;
        } else if (hash !== getHash(rootNode.outerHTML)) {
            debug.warn('Client initial html and server html don\'t match!');
            domNode.removeChild(domNode.firstChild);
            domNode.appendChild(rootNode);
        } else {
            rootNode = domNode.firstChild;
        }

        refCallbacks && this.setRefs(refCallbacks, domNode);
        this.attachEventHandlers(domNode, nextEventHandlers);
        this.mount(nextMounted);

        debug.log(`First expand took ${(endExpand - start).toFixed(3)}ms`);
        debug.log(`First render took ${(performance.now() - start).toFixed(3)}ms`);

        events.on('rerender', throttle(() => {
            this.clearTrigger();
            debug.log('Rereder begin');
            let start = performance.now(),
                nextEventHandlers = {},
                refCallbacks = {},
                nextMounted = {},
                nextVDom = this.expand({
                    vDom: true,
                    store,
                    nextEventHandlers,
                    refCallbacks,
                    nextMounted
                })(json),
                endExpand = performance.now();

            this.unmount(nextMounted);
            this.turnOnDelay();
            rootNode = patch(rootNode, diff(vDom, nextVDom));
            vDom = nextVDom;
            this.turnOffDelay(domNode);
            refCallbacks && this.setRefs(refCallbacks, domNode);
            this.replaceEventHandlers(nextEventHandlers);
            this.mount(nextMounted);

            debug.log(`Expand took ${(endExpand - start).toFixed(3)}ms`);
            debug.log(`Rerender took ${(performance.now() - start).toFixed(3)}ms`);
        }, RENDER_THROTTLE, { leading: true }));
    }

    createTreeItem({ component, props, children, options }) {
        let item = { component, props, children },
            { position } = options;

        if (this.isStateless(component)) {
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
    }

    renderInstance({ attrs, children }, options) {
        let { position, nextMounted } = options,
            { of: component } = attrs,
            stateless = this.isStateless(component),
            { defaults } = component,
            props = Object.assign({}, defaults, attrs),
            current = this.allInstances[position];


        delete props.of;

        // TODO: undefined and null values are same type
        // multiple values (arrays of types), and describe subobjects
        // FIXME: must be disabled in PRODUCTION
        // checkProps(props, component);

        if (typeof current !== 'undefined') {
            current = this.allInstances[position];
            let sameOuter = isSameProps(current.props, props) && children === current.children && component === current.component;

            if (stateless) {
                if (!sameOuter) {
                    current = this.createTreeItem({ component, props, children, options });
                }
            } else {
                Component.beforeRender(current.instance);

                if (!sameOuter || current.instance.state !== current.state) {
                    current.props = props;
                    current.children = children;
                    current.state = current.instance.state;
                    Component.setProps(current.instance, props, children);
                    current.lastRender = Component.render(current.instance);
                    debug.log(`Component ${position} is rerendered`);
                }
            }
        } else {
            current = this.createTreeItem({ component, props, children, options });
        }

        nextMounted[position] = current;

        return current.lastRender;
    }

    isStateless(component) {
        return !(component.prototype instanceof Component);
    }

    calcInstancePosition({ attrs: { of: component, key } }, { position }) {
        if (component.singleton) {
            return `__singletons__${component.name}`;
        } else {
            return `${position}${component.name}`;
        }
    }

    createNode({ tag, attrs = {}, children }, { nextEventHandlers, refCallbacks, position }) {
        let attrsFiltered = Object.keys(attrs).reduce((memo, name) => {
            let eventType = EVENTS_ATTRS[name];

            if (eventType) {
                nextEventHandlers[eventType] = nextEventHandlers[eventType] || {};
                nextEventHandlers[eventType][position] = attrs[name];
            } else if (name === 'ref') {
                refCallbacks[position] = attrs[name];
            } else {
                memo[name] = attrs[name];
                if (name === 'dataset') {
                    memo.key = attrs[name].rrid;
                }
            }

            return memo;
        }, {});

        return h(tag, attrsFiltered, children);
    }

    stringifyTag({ tag, attrs = {}, children }) {
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
    }

    // hasEventsHandlers(attrs = {}) {
    //     return Object.keys(attrs).some(key => !!EVENTS_ATTRS[key]);
    // }
    //
    // FIXME: recursive function => loops
    expand({ refCallbacks, nextEventHandlers, joinTextNodes, nextMounted = {} } = {}) {
        const { isServer, omitIds } = this.options,
            vDom = !isServer,
            store = this.store,
            stringify = isServer,
            _this = this;

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
                let attrs = _this.getAttrsWithDataset(json, { omitIds, position }),
                    item = {
                        tag: json.tag,
                        attrs,
                        children: curried(json.children, `${position}.0`)
                    };

                return stringify
                    ? _this.stringifyTag(item)
                    : vDom
                        ? _this.createNode(item, { position, refCallbacks, nextEventHandlers })
                        : item;
            } else if (typeof json === 'object' && json.tag === RERENDER_TAG) {
                let instancePosition = _this.calcInstancePosition(json, { position }),
                    options = {
                        store,
                        isDom: vDom,
                        position: instancePosition,
                        nextMounted
                    };

                return curried(_this.renderInstance(json, options), `${instancePosition}.0`);
            } else {
                return '';
            }
        };
    }

    getShortId(position) {
        if (!this.ids[position]) {
            this.ids[position] = this.nextShortId;
            this.positionsById[this.nextShortId] = position;
            this.nextShortId++;
        }

        return this.ids[position];
    }

    getAttrsWithDataset(json, { omitIds, position }) {
        let { tag, attrs = {} } = json;

        if (omitIds) {
            return attrs;
        }

        let { dataset } = attrs,
            nextDataset = Object.assign({}, dataset);

        nextDataset.rrid = this.getShortId(position);
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
    }

    attachEventHandlers(domNode, nextEventHandlers) {
        this.replaceEventHandlers(nextEventHandlers);

        Object.keys(EVENTS_ATTRS).forEach(propName => {
            let eventType = EVENTS_ATTRS[propName];

            domNode.addEventListener(eventType, event => {
                if (this.rerenderNow && DELAY_EVENTS[eventType]) {
                    this.delayedEvents[eventType] = {
                        event,
                        eventType,
                        eventHandlers: this.eventHandlers[eventType]
                    };
                }

                this.executeCallbacks({
                    domNode,
                    event,
                    eventType,
                    eventHandlers: this.eventHandlers[eventType]
                });
            }, true);
        });
    }

    executeCallbacks({ domNode, event, eventType, eventHandlers }) {
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
                position = this.positionsById[rrId];

            if (position && eventHandlers[position]) {
                debug.log(`Triggered event ${eventType} on ${position}.`);
                eventHandlers[position](synteticEvent);
            }

            currentNode = currentNode.parentNode;
        }

        if (synteticEvent.prevented) {
            event.preventDefault();
        }
    }

    replaceEventHandlers(nextEventHandlers) {
        this.eventHandlers = nextEventHandlers;
    }

    setRefs(callbacks, domNode) {
        let nextRefsDom = {};

        Array.prototype.slice.call(domNode.querySelectorAll('[data-rrref]')).forEach(node => {
            let id = node.dataset.rrid,
                position = this.positionsById[id],
                callback = callbacks[position];

            if (!callback) {
                return;
            }

            if (this.refsDom[position] !== node) {
                callback(node);
            }

            nextRefsDom[position] = node;
        });

        this.refsDom = nextRefsDom;
    }

    unmount(nextMounted) {
        let start = performance.now();

        Object.keys(this.mountedInstances).forEach(position => {
            let next = nextMounted[position],
                prev = this.mountedInstances[position];

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
                    this.allInstances[position] = undefined;
                }
            }
        });

        debug.log(`Unmount took ${(performance.now() - start).toFixed(3)}ms`);
    }

    mount(nextMounted) {
        let start = performance.now();

        Object.keys(nextMounted).forEach(position => {
            let next = nextMounted[position],
                prev = this.mountedInstances[position];

            if (prev && prev.instance) {
                if (next.instance !== prev.instance) {
                    Component.mount(next.instance);
                    this.allInstances[position] = next;
                }
            } else {
                if (next.instance) {
                    Component.mount(next.instance);
                }

                this.allInstances[position] = next;
            }
        });

        this.mountedInstances = nextMounted;

        debug.log(`Mount took ${(performance.now() - start).toFixed(3)}ms`);
    }

    clearTrigger() {
        if (rerenderTrigger) {
            clearTimeout(rerenderTrigger);
            rerenderTrigger = undefined;
        }
    }

    turnOnDelay() {
        this.rerenderNow = true;
    }

    // blur and focus fix
    turnOffDelay(domNode) {
        if (this.delayedEvents.blur && !this.delayedEvents.focus) {
            const {
                    event: {
                        target: prevFocusNode
                    }
                } = this.delayedEvents.blur,
                {
                    dataset: {
                        rrid: prevFocusId
                    }
                } = prevFocusNode,
                nextFocusNode = typeof prevFocusId !== 'undefined' && domNode.querySelectorAll(`[data-rrid="${prevFocusId}"]`)[0];

            if (nextFocusNode) {
                this.repairFocusAndSelection(nextFocusNode, prevFocusNode);
            } else {
                this.executeCallbacks(Object.assign({ domNode }, this.delayedEvents.blur));
            }
        }

        this.rerenderNow = false;

        if (this.delayedEvents.blur && this.delayedEvents.focus) {
            const {
                    event: {
                        target: prevFocusNode
                    }
                } = this.delayedEvents.focus,
                {
                    dataset: {
                        rrid: prevFocusId
                    }
                } = prevFocusNode,
                nextFocusNode = typeof prevFocusId !== 'undefined' && domNode.querySelectorAll(`[data-rrid="${prevFocusId}"]`)[0];

            if (nextFocusNode) {
                if (nextFocusNode !== prevFocusNode) {
                    this.repairFocusAndSelection(nextFocusNode, prevFocusNode);
                } else {
                    this.executeCallbacks(Object.assign({ domNode }, this.delayedEvents.focus));
                }
            }
        }

        this.delayedEvents = {};
    }

    isDisabledSelection(node) {
        return node.tagName === 'INPUT' && !SUPPORT_SELECTION_INPUT_TYPES[node.type];
    }

    repairFocusAndSelection(node, prev) {
        node.focus();

        if (!this.isDisabledSelection(prev) && typeof prev.selectionStart !== 'undefined') {
            const { selectionStart, selectionEnd, selectionDirection = 'none' } = prev;

            node.setSelectionRange(selectionStart, selectionEnd, selectionDirection);
        }
    }
}

const
    clientRender = function(json, domNode, options) {
        return new RenderController({
            json,
            domNode,
            options: Object.assign({}, options, { isServer: false })
        });
    },

    serverRender = function(json, options) {
        const controller = new RenderController({
            json,
            options: Object.assign({}, options, { isServer: true })
        });

        return controller.expand()(json);
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
