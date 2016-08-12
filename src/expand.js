import Component from './Component';
import { debug, escape, getHash } from './utils';
import { patch, diff } from 'virtual-dom';
import createElement from 'virtual-dom/create-element';
import h from 'virtual-dom/h';

var tree = {},
    eventHandlers = {};

const PRIMITIVE_TYPES = {
        number: true,
        string: true,
        boolean: true
    },

    ATTRS_TO_JS = {
        class: 'className'
    },

    EVENTS_ATTRS = {
        onclick: 'click',
        onmousedown: 'mousedown',
        onmouseup: 'mouseup',
        onchange: 'change',
        onkeydown: 'keydown',
        onkeyup: 'keyup',
        onfocus: 'focus',
        onblur: 'blur'
    },

    RERENDER_TAG = 'instance',

    isSameProps = function(nextProps, props) {
        return !Object.keys(nextProps).some(name => nextProps[name] !== props[name]);
    },

    createTreeItem = function({ component, props, children, options }) {
        let item = { props };

        if (isStateless(component)) {
            item.lastRender = component(props, children, options);
        } else {
            item.instance = new component(props, options);
            item.lastState = item.instance.state;
            item.lastRender = item.instance.render();
        }

        return item;
    },

    renderInstance = function({ attrs, children }, options) {
        let { position } = options,
            { of: component } = attrs,
            stateless = isStateless(component),
            { defaults } = component,
            props = Object.assign({}, defaults, attrs, { children }),
            isExists = !!tree[position],
            current;

        if (isExists) {
            current = tree[position];

            if (stateless) {
                if (!isSameProps(current.props, props)) {
                    current = createTreeItem({ component, props, children, options });
                }
            } else if (!isSameProps(current.props, props) || current.instance.state !== current.lastState) {
                current.instance.setProps(props, children);
                current.lastRender = current.instance.render();
            }
        } else {
            current = createTreeItem({ component, props, children, options });
        }

        tree[position] = current;

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

    createNode = function({ tag, attrs: attrsIn = {}, children }, { eventHandlers, position }) {
        let hasEventsAttrs = false,
            attrs = Object.keys(attrsIn).reduce((memo, keyIn) => {
                let key = keyIn.toLowerCase();

                if (!EVENTS_ATTRS[key]) {
                    memo[ATTRS_TO_JS[key] || key] = attrsIn[key];
                } else {
                    hasEventsAttrs = true;
                    eventHandlers[position] = attrsIn[key];
                }
                return memo;
            }, {});

        if (hasEventsAttrs) {
            attrs['data-rrid'] = position;
        }

        return h(tag, attrs, children);
    },

    stringifyTag = function({ tag, attrs, children }) {
        let attrsString = '';

        for (let name in attrs) {
            if (attrs.hasOwnProperty(name) && attrs[name] || attrs[name] === 0) {
                let nameLowerCase = name.toLowerCase();
                if (!EVENTS_ATTRS[nameLowerCase]) {
                    attrsString += ` ${nameLowerCase}="${escape(attrs[name])}"`;
                }
            }
        }

        // FIXME: tag inspections
        // TODO: implement selfclosed tags
        return `<${tag}${attrsString}>${children}</${tag}>`;
    },

    // FIXME: recursive function => loops
    expand = function({ stringify, vDom, store, eventHandlers }) {
        return function curried(json, position = '') {
            if (Array.isArray(json)) {
                let expandedArray = json.map((item, index) => curried(item, `${position}.${index}`));

                return stringify ? expandedArray.join('') : expandedArray;
            } else if (PRIMITIVE_TYPES[typeof json]) {
                return escape(json + '');
            } else if (typeof json === 'function') {
                return curried(json(), position);
            } else if (typeof json === 'object' && json.attrs && typeof json.attrs._ === 'object') {
                let attrs = Object.assign({}, json.attrs._, json.attrs);

                delete attrs._;
                Object.assign(json, { attrs });

                return curried(json, position);
            } else if (typeof json === 'object' && json.tag !== RERENDER_TAG) {
                let item = {
                    tag: json.tag,
                    attrs: json.attrs,
                    children: curried(json.children, `${position}.0`)
                };

                return stringify
                    ? stringifyTag(item)
                    : vDom
                        ? createNode(item, { position, eventHandlers })
                        : item;
            } else if (typeof json === 'object' && json.tag === RERENDER_TAG) {
                let instancePosition = calcInstancePosition(json, { position }),
                    options = {
                        store,
                        isDom: vDom,
                        position: instancePosition
                    };

                return curried(renderInstance(json, options), `${instancePosition}.0`);
            } else {
                return '';
            }
        };
    },

    renderToString = function(json, { store } = {}) {
        return expand({
            stringify: true,
            store
        })(json);
    },

    attachMutationListener = function() {
        // let observer = new MutationObserver(function(mutations) {
        //     mutations.forEach(function(mutation) {
        //         debug.log(mutation);
        //     });
        // });
        //
        // observer.observe(document.getElementById('application'), {
        //     attributes: true,
        //     childList: true,
        //     attributeOldValue: true,
        //     subtree: true
        // });
    },

    attach = function(json, domNode, { store = {} } = {}) {

        let tree = expand({
                vDom: true,
                store,
                eventHandlers
            })(json),
            hash = domNode.dataset && domNode.dataset.hash,
            rootNode = createElement(tree),
            newHash = getHash(rootNode.outerHTML);

        if (hash && hash !== newHash) {
            debug.warn('Client initial html and server html don\'t match!');
            domNode.removeChild(domNode.firstChild);
            domNode.appendChild(rootNode);
        } else {
            rootNode = domNode.firstChild;
        }

        // attachEventListeners(eventHandlers);
        attachMutationListener();

        store.on('change', () => {
            let newEventHandlers = {},
                newTree = expand({
                    vDom: true,
                    store,
                    eventHandlers: newEventHandlers
                })(json),
                patches = diff(tree, newTree);

            tree = newTree;
            rootNode = patch(rootNode, patches);
            eventHandlers = newEventHandlers;
        });
    };

export { expand as default, isSameProps, renderToString, attach };
