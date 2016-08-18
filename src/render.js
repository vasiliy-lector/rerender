import Component from './Component';
import { debug, escape, escapeHtml, getHash, isSameProps } from './utils';
import { patch, diff } from 'virtual-dom';
import createElement from 'virtual-dom/create-element';
import h from 'virtual-dom/h';
import throttle from 'lodash/throttle';

var allInstances = {},
    mountedInstances = {},
    eventHandlers = {};

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
        onMousedown: 'mousedown',
        onMouseup: 'mouseup',
        onChange: 'change',
        onKeydown: 'keydown',
        onKeyup: 'keyup',
        onFocus: 'focus',
        onBlur: 'blur',
        onInput: 'input',
        onSubmit: 'submit'
    },

    RERENDER_TAG = 'instance',

    createTreeItem = function({ component, props, children, options }) {
        let item = { component, props, children };

        if (isStateless(component)) {
            item.lastRender = component(props, children, options);
        } else {
            item.instance = new component(props, children, options);
            item.lastState = item.instance.state;
            item.lastRender = item.instance.render();
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

        if (isExists) {
            current = allInstances[position];
            let sameOuter = false && isSameProps(current.props, props) && children === current.children && component === current.component;

            if (stateless) {
                if (!sameOuter) {
                    current = createTreeItem({ component, props, children, options });
                }
            } else {
                if (!current.componentMounted && current.instance.componentWillMount) {
                    current.instance.componentWillMount();
                }

                if (!sameOuter || current.instance.state !== current.lastState) {
                    current.instance.setProps(props, children);
                    current.lastRender = current.instance.render();
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
        } else if (key) {
            return `__keys__${key}`;
        } else {
            return `${position}${component.name}`;
        }
    },

    createNode = function({ tag, attrs = {}, children }, { nextEventHandlers, position }) {
        let attrsFiltered = Object.keys(attrs).reduce((memo, name) => {
            if (typeof attrs[name] === 'undefined' || attrs[name] === '') {
                return memo;
            }

            let eventType = EVENTS_ATTRS[name];

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
            } else if (!EVENTS_ATTRS[name]) {
                memo += ` ${name}="${escape(attrs[name])}"`;
            }

            return memo;
        }, '');

        // FIXME: tag inspections
        // TODO: implement selfclosed tags
        return `<${tag}${attrsString}>${children}</${tag}>`;
    },

    hasEventsHandlers = function(attrs = {}) {
        return Object.keys(attrs).some(key => !!EVENTS_ATTRS[key]);
    },

    // FIXME: recursive function => loops
    expand = function({ stringify, omitIds, vDom, store, nextEventHandlers, joinTextNodes, nextMounted = {} }) {

        return function curried(json, position = '') {
            if (Array.isArray(json)) {
                let expandedArray = json.map((item, index) => curried(item, `${position}.${index}`));
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
                            dataset: Object.assign({}, json.attrs.dataset, {
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
                    { path } = event;

                for (let i = 0, l = path.length; i < l && !synteticEvent.stopped && path[i] !== domNode; i++) {
                    let currentNode = path[i],
                        rrId = currentNode.dataset && currentNode.dataset.rrid;

                    if (rrId && eventHandlersOfType[rrId]) {
                        eventHandlersOfType[rrId](synteticEvent);
                    }
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

    mount = function(nextMounted) {
        Object.keys(mountedInstances).concat(Object.keys(nextMounted)).forEach(position => {
            let next = nextMounted[position],
                prev = mountedInstances[position];

            if (next) {
                if (prev && prev.instance) {
                    if (next.instance !== prev.instance) {
                        prev.instance.unmount();
                        prev.instance.destroy();

                        next.instance.mount();
                        allInstances[position] = next;
                    }
                } else {
                    if (next.instance) {
                        next.instance.mount();
                    }

                    allInstances[position] = next;
                }
            } else {
                if (prev.instance) {
                    prev.instance.unmount();

                // stateless
                } else {
                    allInstances[position] = undefined;
                }
            }
        });

        mountedInstances = nextMounted;
    },

    clientRender = function(json, domNode, { store = {} } = {}) {
        let nextEventHandlers = {},
            nextMounted = {},
            vDom = expand({
                vDom: true,
                store,
                joinTextNodes: true,
                nextEventHandlers,
                nextMounted
            })(json),
            hash = domNode.dataset && domNode.dataset.hash,
            rootNode = createElement(vDom),
            newHash = getHash(rootNode.outerHTML);

        if (hash && hash !== newHash) {
            debug.warn('Client initial html and server html don\'t match!');
            domNode.removeChild(domNode.firstChild);
            domNode.appendChild(rootNode);
        } else {
            rootNode = domNode.firstChild;
        }

        attachEventHandlers(domNode, nextEventHandlers);
        mount(nextMounted);

        store.on('change,innerStateChange', throttle(() => {
            let nextEventHandlers = {},
                nextMounted = {},
                nextVDom = expand({
                    vDom: true,
                    store,
                    nextEventHandlers,
                    nextMounted
                })(json);

            rootNode = patch(rootNode, diff(vDom, nextVDom));
            vDom = nextVDom;

            replaceEventHandlers(nextEventHandlers);
            mount(nextMounted);
        }, RENDER_THROTTLE, { leading: true }));
    },

    scheduleUpdate = function({ store, position }) {
        debug.log('schedule: ', position);
        store.emit('innerStateChange');
    };

export { serverRender, clientRender, scheduleUpdate };
