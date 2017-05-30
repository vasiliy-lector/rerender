import { VCOMPONENT_STATELESS } from './types';

function VComponentStateless(
    componentType,
    props,
    children,
    id,
    template,
    componentTemplate,
    context
) {
    this.componentType = componentType;
    this.props = props;
    this.children = children;
    this.id = id;
    this.template = template;
    this.componentTemplate = componentTemplate;
    this.context = context;
    this.parent = context.parent;
}

VComponentStateless.prototype = {
    type: VCOMPONENT_STATELESS,

    getParent() {
        return this.parent;
    },

    set(name, value) {
        this[name] = value;
    }
};

export default VComponentStateless;
