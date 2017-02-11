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

function componentDom(config, jsx) {
    const { store, events } = config;

    return function(tag, props, children, position) {
        position = position.updateOwner(position.absolute);
        const { instances, nextInstances, nextNewInstances } = config;
        let current = instances[position.absolute],
            changed = true,
            componentTemplate;

        config.currentOwnerPosition = position.absolute;
        config.currentTemplateIndex = 0;

        if (current === undefined || current.tag !== tag) {
            current = { tag, props, children, cachedTemplates: [] };
            nextInstances[position.absolute] = current;

            if (isComponent(tag)) {
                current.instance = new tag(props, children, { jsx, store, events, antibind: tag.antibind });
                nextNewInstances[position.absolute] = current.instance;
                if (props.ref && !tag.wrapper && typeof props.ref === 'function') {
                    props.ref(current.instance);
                }
                Component.beforeRender(current.instance);
                componentTemplate = Component.render(current.instance);
                current.state = current.instance.state;
            } else {
                componentTemplate = tag({ props, children, jsx });
            }
        } else {
            const sameProps = shallowEqual(current.props, props);
            if (sameProps) {
                props = current.props;
            }
            const sameOuter = sameProps && current.children === children;

            if (isComponent(tag)) {
                Component.beforeRender(current.instance);
                if (!sameOuter || current.instance.state !== current.state) {
                    let instance = current.instance;
                    current = { tag, props, children, instance, state: instance.state };
                    nextInstances[position.absolute] = current;
                    if (!sameOuter) {
                        Component.setProps(instance, props, children);
                    }
                    componentTemplate = Component.render(instance);
                } else {
                    changed = false;
                }
            } else if (!sameOuter) {
                current = { tag, props, children };
                nextInstances[position.absolute] = current;
                componentTemplate = tag({ props, children, jsx });
            } else {
                changed = false;
            }
        }

        if (changed) {
            current.componentTemplate = componentTemplate;
        }

        delete instances[position.absolute];

        return current.componentTemplate.exec(position.updateAbsolute(position.absolute + '.0'));
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

export default component;
