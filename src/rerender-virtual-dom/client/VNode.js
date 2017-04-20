import { VNODE } from './types';

function VNode(tag, attrs) {
    this.tag = tag;
    this.attrs = attrs;
}

VNode.prototype = {
    type: VNODE
};

export default VNode;
