import { VCOMPONENT } from './types';

function VComponent(
    componentType,
    props,
    children,
    id,
    template,
    componentTemplate,
    context,
    instance,
    state
) {
    this.componentType = componentType;
    this.props = props;
    this.children = children;
    this.id = id;
    this.template = template;
    this.componentTemplate = componentTemplate;
    this.context = context;
    this.instance = instance;
    this.state = state;
    this.parent = context.parent;
}

VComponent.prototype = {
    type: VCOMPONENT,

    set(name, value) {
        this[name] = value;
    }
};

export default VComponent;
