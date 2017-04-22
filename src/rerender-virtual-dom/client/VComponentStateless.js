import { VCOMPONENT_STATELESS } from '../types';

function VComponentStateless(id, componentType, props, children, template) {
    this.id = id;
    this.componentType = componentType;
    this.props = props;
    this.children = children;
    this.template = template;
}

VComponentStateless.prototype = {
    type: VCOMPONENT_STATELESS,

    set(name, value) {
        this[name] = value;
    }
};

export default VComponentStateless;
