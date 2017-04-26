import { VCOMPONENT_STATELESS } from './types';

function VComponentStateless(
    componentType,
    props,
    children,
    id,
    template
) {
    this.componentType = componentType;
    this.props = props;
    this.children = children;
    this.id = id;
    this.template = template;
}

VComponentStateless.prototype = {
    type: VCOMPONENT_STATELESS,

    set(name, value) {
        this[name] = value;
    }
};

export default VComponentStateless;
