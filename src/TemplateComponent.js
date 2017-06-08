import { TEMPLATE, TEMPLATE_COMPONENT, TEMPLATE_VNODE, VCOMPONENT } from './types';
import VComponent from './VComponent';
import { shallowEqualProps } from './utils';
import VText from './VText';
import { componentInit, componentRender, componentBeforeRender, componentSetProps } from './componentLifeCycle';
import reuseTemplate from './reuseTemplate';
import { specialAttrs, specialAttrsWrapper } from './constants';

function TemplateComponent(componentType, props, children, targetComponentType) {
    var nextProps = props || {};

    if (componentType.wrapper) {
        nextProps = Object.keys(nextProps).reduce((memo, key) => {
            if (specialAttrsWrapper[key]) {
                this[key] = nextProps[key];
            } else {
                memo[key] = nextProps[key];
            }

            return memo;
        }, {});
    } else {
        nextProps = Object.keys(nextProps).reduce((memo, key) => {
            if (specialAttrs[key]) {
                this[key] = nextProps[key];
            } else {
                memo[key] = nextProps[key];
            }

            return memo;
        }, {});
    }

    if (componentType.defaults) {
        for (var name in componentType.defaults) {
            if (nextProps[name] === undefined) {
                nextProps[name] = componentType.defaults[name];
            }
        }
    }

    if (targetComponentType) {
        nextProps.targetComponentType = targetComponentType;
        if (this.controller) {
            nextProps.targetController = this.controller;
        }
    }

    this.componentType = componentType;
    this.props = nextProps;
    this.children = children;
}

TemplateComponent.prototype = {
    type: TEMPLATE,
    subtype: TEMPLATE_COMPONENT,

    preprocessInstance(instance) {
        var antibind = this.componentType.antibind;

        if (antibind && Array.isArray(antibind)) {
            for (var i = 0, l = antibind.length; i < l; i++) {
                var name = antibind[i];

                if (typeof instance[name] === 'function') {
                    instance[name] = instance[name].bind(instance);
                }
            }
        }
    },

    renderServer(config) {
        var componentType = this.componentType;
        var instance = new componentType(this.props, this.children, config.componentOptions, undefined, config.store.getState());
        this.preprocessInstance(instance);
        componentInit(instance);
        var template = componentRender(instance);

        return template ? template.renderServer(config) : '';
    },

    render(config, context) {
        var props = this.props;
        var children = this.children;
        var template;
        var component;
        var componentType = this.componentType;
        var {
            components,
            nextComponents,
            mountComponents,
            updateComponents,
            store,
            componentOptions
        } = config;
        var id = context.getId();
        var prev = components[id];
        var needStore = componentType.store;

        if (prev === undefined || prev.type !== VCOMPONENT || prev.componentType !== componentType) {
            var storeState;
            if (needStore) {
                storeState = store.getState(undefined, true);
            }
            var instance = new componentType(
                props,
                children,
                componentOptions,
                id,
                needStore ? storeState : undefined
            );
            this.preprocessInstance(instance);
            componentInit(instance);
            if (this.ref && typeof this.ref === 'function') {
                this.ref(instance);
            }
            if (this.wrapperRef && typeof this.wrapperRef === 'function') {
                this.wrapperRef(instance);
            }
            componentBeforeRender(instance);
            template = componentRender(instance);

            component = new VComponent(
                componentType,
                props,
                children,
                id,
                template,
                this,
                context,
                instance,
                instance.getState(undefined, true)
            );

            if (needStore) {
                component.set('storeState', storeState);
            }

            nextComponents[id] = component;
            mountComponents[id] = component.ref;
        } else {
            var instance = prev.ref;
            var storeState = store.getState(undefined, true);

            componentBeforeRender(instance);

            var sameProps = shallowEqualProps(prev.props, props);
            // FIXME
            var sameChildren = false; // children.isEqual(prev.children);
            var sameState = instance.getState(undefined, true) !== prev.state;
            var sameStoreState = !needStore || prev.storeState === storeState;

            if (sameProps) {
                props = prev.props;
            }

            if (sameChildren) {
                children = prev.children;
            }

            if (sameProps && sameChildren && sameState && sameStoreState) {
                template = prev.template;
            } else {
                if (!sameProps || !sameChildren || !sameStoreState) {
                    var additional;

                    if (needStore) {
                        additional = storeState;
                    }

                    componentSetProps(instance, props, children, additional);
                }
                template = reuseTemplate(componentRender(instance), prev.template);
            }

            component = new VComponent(
                componentType,
                props,
                children,
                id,
                template,
                this,
                context,
                instance,
                instance.getState(undefined, true)
            );

            if (needStore) {
                component.set('storeState', storeState);
            }

            nextComponents[id] = component;
            updateComponents[id] = component.ref;
        }

        // FIXME: createText and move increment inside render
        var childs;

        if (template) {
            childs = template.render(
                config,
                context.addIdLevel(component)[
                    template.subtype === TEMPLATE_VNODE
                        ? 'incrementDom'
                        : 'incrementComponent'
                ](template.key, template.uniqid)
            );
        } else {
            var nextContext = context.addIdLevel(component).incrementDom();
            var nextTextNode = new VText('', nextContext);
            childs = nextTextNode;
            config.nextNodes[nextContext.getId()] = nextTextNode;
        }

        component.set('childs', [childs]);

        return component;
    }
};

export default TemplateComponent;
