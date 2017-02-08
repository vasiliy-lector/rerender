import { shallowEqual } from '../utils';
import Component from '../Component';

// FIXME find faster way to determine Component
function isComponent(tag) {
    return tag.prototype instanceof Component;
}

function component(config, jsx) {
    if (config.stringify) {
        return componentStringify(config, jsx);
    } else {
        return componentDom(config, jsx);
    }
}

function componentDom({ instances, nextInstances, nextNewInstances, store, events }, jsx) {
    return function(tag, props, children, position) {
        position = calcComponentPosition(tag, props, position);
        let current = instances[position],
            changed = true,
            lastRender;

        if (tag.defaults && typeof tag.defaults === 'object') {
            const defaultsKeys = Object.keys(tag.defaults);

            for (let i = 0, l = defaultsKeys.length; i < l; i++) {
                if (props[defaultsKeys[i]] === undefined) {
                    props[defaultsKeys[i]] = tag.defaults[defaultsKeys[i]];
                }
            }
        }

        if (current === undefined || current.tag !== tag) {
            current = { tag, props, children };

            if (isComponent(tag)) {
                current.instance = new tag(props, children, { jsx, store, events, antibind: tag.antibind });
                nextNewInstances[position] = current.instance;
                if (props.ref && !tag.wrapper && typeof props.ref === 'function') {
                    props.ref(current.instance);
                }
                Component.beforeRender(current.instance);
                lastRender = Component.render(current.instance);
                current.state = current.instance.state;
            } else {
                lastRender = tag({ props, children, jsx });
            }
        } else {
            const sameOuter = shallowEqual(current.props, props) && current.children === children;

            if (isComponent(tag)) {
                Component.beforeRender(current.instance);
                if (!sameOuter || current.instance.state !== current.state) {
                    let instance = current.instance;
                    current = { tag, props, children, instance, state: instance.state };
                    if (!sameOuter) {
                        Component.setProps(instance, props, children);
                    }
                    lastRender = Component.render(instance);
                } else {
                    changed = false;
                }
            } else if (!sameOuter) {
                current = { tag, props, children };
                lastRender = tag({ props, children, jsx });
            } else {
                changed = false;
            }
        }

        if (changed) {
            current.lastRender = lastRender ? lastRender.exec(position + '.0') : jsx.text('');
        }

        nextInstances[position] = current;
        delete instances[position];

        return current.lastRender;
    };
}

function componentStringify({ store }, jsx) {
    return function(tag, props, children, position) {
        // TODO it seems no need right position on server?
        // position = calcComponentPosition(tag, props, position);
        let renderResult;

        if (tag.prototype instanceof Component) {
            const instance = new tag(props, children, { position, jsx, store, antibind: tag.antibind });
            Component.beforeRender(instance);

            renderResult = Component.render(instance);
        } else {
            renderResult = tag({ props, children, jsx });
        }

        return renderResult ? renderResult.exec(position + '.0') : jsx.text('');
    };
}

function calcComponentPosition(tag, props, position) {
    // TODO warning if many instances of singleton or with same key
    if (tag.uniqid) {
        return `u${tag.uniqid}`;
    } else if (props.uniqid) {
        return `u${props.uniqid}`;
    } else if (props.key) {
        return `position.k${props.key}`;
    } else {
        return `${position}.c`;
    }
}

export default component;
