import { VNODE } from './types';

function VNode(tag, attrs, position, id) {
    this.tag = tag;
    this.attrs = attrs;
    this.position = position;
    this.id = id;
}

VNode.prototype = {
    type: VNODE
};

export default VNode;
