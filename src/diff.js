import { VROOT, VNODE, VTEXT } from './types';
import Patch from './Patch';
import { shallowEqual } from './utils';

function diff(nextNode, node, options, patch, nextSibling) {
    if (nextNode.type === VNODE) {
        const context = nextNode.context;
        const node = options.nodesById[context.id];

        if (!node) {
            patch.create(context.parentPosition, context.domIndex, nextNode);
            if (options.normalize && nextNode.attrs) {
                for (let name in nextNode.attrs) {
                    if (name === 'ref' && typeof nextNode.attrs.ref === 'function') {
                        patch.setRef(context.position, nextNode.attrs.ref);
                    } else if (name.substr(0, 2) === 'on') {
                        patch.attachEvents(context.position, nextNode.attrs);
                        break;
                    }
                }
            }
        } else {
            if (node.tag !== nextNode.tag) {
                patch.replace(context.position, nextNode);
            } else if (node.context.domId !== context.domId) {
                patch.move(
                    node.context.position,
                    context.parentPosition,
                    context.domIndex,
                    nextNode
                );
            }

            if (!shallowEqual(node.attrs, nextNode.attrs)) {
                patch.update(context.position, nextNode.attrs);
            }
        }

        for (let i = 0, l = nextNode.childNodes.length; i < l; i++) {
            diff(
                nextNode.childNodes[i],
                node && node.childNodes[i],
                options,
                patch,
                options.normalize ? nextNode.childNodes[i + 1] : null
            );
        }
    } else if (nextNode.type === VTEXT) {
        const context = nextNode.context;
        const node = options.nodesById[context.id];
        if (!node) {
            patch.create(context.parentPosition, context.domIndex, nextNode);
            if (options.normalize && nextSibling && nextSibling.type === VTEXT) {
                patch.splitText(context.position, nextNode.value.length);
            }
        } else if (node.value !== nextNode.value) {
            patch.replace(context.position, nextNode);
        }
    } else if (nextNode.type === VROOT) {
        patch = new Patch();

        for (let id in options.nodesById) {
            if (!options.nextNodesById[id]) {
                patch.remove(options.nodesById[id], options.nodesById[id].context.position);
            }
        }

        diff(nextNode.childNodes[0], node.childNodes[0], options, patch);

        return patch;
    }
}

export default diff;
