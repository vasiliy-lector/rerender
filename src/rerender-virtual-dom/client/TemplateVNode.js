import { TEMPLATE, TEMPLATE_VNODE } from '../types';
import VNode from './VNode';
import VText from './VText';

function TemplateVNode(instance, props, children) {
    this.instance = instance;
    this.props = props;
    this.children = children;
}

TemplateVNode.prototype = {
    type: TEMPLATE,
    subtype: TEMPLATE_VNODE,

    render() {
        const nextNode = new VNode(this.instance, this.props);

        return nextNode;
    }
};

export default TemplateVNode;
