import { VROOT, VNODE, VTEXT } from './types';
import Patch, { Create, Replace, Move, Update, Remove } from './Patch';
import { shallowEqual } from './utils';

function diff(nextNode, options, insideCreation) {
    if (nextNode.type === VNODE) {
        const context = nextNode.context;
        const node = options.nodesById[context.id];
        let childrenCreated;
        let childrenNeedCreation;

        if (!node) {
            if (!insideCreation) {
                options.patch.push(new Create(nextNode));
                childrenCreated = true;
            }
        } else {
            if (node.tag !== nextNode.tag) {
                if (!insideCreation) {
                    options.patch.push(new Replace(nextNode));
                    childrenCreated = true;
                }
            } else if (node.context.domId !== context.domId) {
                options.patch.push(new Move(nextNode, node));
                childrenNeedCreation = true;
            }

            if (!shallowEqual(node.attrs, nextNode.attrs)) {
                options.patch.push(new Update(nextNode, node));
            }
        }

        for (let i = 0, l = nextNode.childNodes.length; i < l; i++) {
            diff(
                nextNode.childNodes[i],
                options,
                childrenNeedCreation
                    ? false
                    : insideCreation || childrenCreated
            );
        }
    } else if (nextNode.type === VTEXT) {
        const context = nextNode.context;
        const node = options.nodesById[context.id];
        if (!node) {
            if (!insideCreation) {
                options.patch.push(new Create(nextNode));
            }
        } else if (node.value !== nextNode.value) {
            options.patch.push(new Replace(nextNode));
        }
    } else if (nextNode.type === VROOT) {
        const patch = new Patch();

        diff(nextNode.childNodes[0], { ...options, patch });
        for (let id in options.nodesById) {
            if (!options.nextNodesById[id]) {
                options.patch.push(new Remove(options.nodesById[id]));
            }
        }

        return patch;
    }
}

export default diff;
