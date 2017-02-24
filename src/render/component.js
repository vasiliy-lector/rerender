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
        const { instances, nextInstances, nextNewInstances } = config;
        let current = instances[position.id],
            changed = true,
            componentTemplate;

        config.currentOwnerPosition = position.id;
        config.currentTemplateIndex = 0;

        if (current === undefined || current.tag !== tag) {
            current = { tag, props, children, cachedTemplates: [] };
            nextInstances[position.id] = current;

            if (isComponent(tag)) {
                current.instance = new tag(props.common, children, { jsx, store, events, antibind: tag.antibind });
                nextNewInstances[position.id] = current.instance;
                if (props.special.ref && typeof props.special.ref === 'function') {
                    props.special.ref(current.instance);
                }
                Component.beforeRender(current.instance);
                componentTemplate = Component.render(current.instance);
                current.state = current.instance.state;
            } else {
                componentTemplate = tag({ props: props.common, children, jsx });
            }
        } else {
            const sameProps = shallowEqual(current.props.common, props.common);
            if (sameProps) {
                props = current.props;
            }
            const sameOuter = sameProps && current.children === children;

            if (isComponent(tag)) {
                Component.beforeRender(current.instance);
                if (!sameOuter || current.instance.state !== current.state) {
                    let instance = current.instance;
                    current = { tag, props, children, instance, state: instance.state, cachedTemplates: current.cachedTemplates || [] };
                    nextInstances[position.id] = current;
                    if (!sameOuter) {
                        Component.setProps(instance, props.common, children);
                    }
                    componentTemplate = Component.render(instance);
                } else {
                    changed = false;
                }
            } else if (!sameOuter) {
                current = { tag, props, children, cachedTemplates: current.cachedTemplates || [] };
                nextInstances[position.id] = current;
                componentTemplate = tag({ props: props.common, children, jsx });
            } else {
                changed = false;
            }
        }

        if (changed) {
            current.componentTemplate = componentTemplate;
        }

        delete instances[position.id];

        return current.componentTemplate.exec(position.updateId(position.id + '.0'));
    };
}

function componentStringify({ store }, jsx) {
    return function(tag, { common: props }, children, position) {
        let renderResult;

        if (tag.prototype instanceof Component) {
            const instance = new tag(props, children, { jsx, store, antibind: tag.antibind });
            Component.beforeRender(instance);

            renderResult = Component.render(instance);
        } else {
            renderResult = tag({ props, children, jsx });
        }

        // FIXME: no need exec on server because no position dependency
        return renderResult ? renderResult.exec(position + '.0') : jsx.text('');
    };
}

export default component;
