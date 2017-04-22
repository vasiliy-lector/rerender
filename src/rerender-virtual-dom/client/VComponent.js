import { VCOMPONENT, VCOMPONENT } from '../types';

function VComponent(
    componentType,
    props,
    children,
    id,
    template,
    instance,
    state
) {
    this.componentType = componentType;
    this.props = props;
    this.children = children;
    this.id = id;
    this.template = template;
    this.instance = instance;
    this.state = state;
}

VComponent.prototype = {
    type: VCOMPONENT,

    set(name, value) {
        this[name] = value;
    }
};

export default VComponent;
