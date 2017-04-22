import { VCOMPONENT, VCOMPONENT } from '../types';

function VComponent(id, componentType, props, children, state, instance, template) {
    this.id = id;
    this.componentType = componentType;
    this.props = props;
    this.children = children;
    this.state = state;
    this.instance = instance;
    this.template = template;
}

VComponent.prototype = {
    type: VCOMPONENT,

    set(name, value) {
        this[name] = value;
    }
};

export default VComponent;
