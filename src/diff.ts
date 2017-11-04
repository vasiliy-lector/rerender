import { VNODE, VTEXT } from './constants';
import { Patch, Create, Replace, Move, Update, Remove, RemoveRef } from './Patch';
import { shallowEqual, groupByIdNodes } from './utils';

import { Map, VirtualDomNode } from './types';

type OptionsNext = {
    patch: Patch,
    nodesById: Map<VirtualDomNode>
};
type OptionsPrev = {
    patch: Patch,
    nextNodesById: Map<VirtualDomNode>
};
type Options = {
    nodesById?: Map<VirtualDomNode>,
    nextNodesById?: Map<VirtualDomNode>,
    document?: HTMLDocument
};

function diffNext(nextNode: VirtualDomNode, options: OptionsNext, insideCreation?: boolean) {
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

            if (!shallowEqual(node.attrs, nextNode.attrs)
                || (nextNode.dynamic && nextNode.dynamic.prevAttrs)) {
                options.patch.push(new Update(nextNode, node));
            }
        }

        for (let i = 0, l = nextNode.childNodes.length; i < l; i++) {
            diffNext(
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
    }
}

function diffPrev(node: VirtualDomNode, options: OptionsPrev, insideRemove?: boolean) {
    let childrenRemoved;
    let childrenNeedRemove;

    if (!options.nextNodesById[node.context.id]) {
        if (!insideRemove) {
            options.patch.push(new Remove(node));
            childrenRemoved = true;
        } else if (node.attrs && typeof node.attrs.ref === 'function') {
            options.patch.push(new RemoveRef(node));
        }
    } else if (insideRemove) {
        childrenNeedRemove = true;
    }

    if (node.type === VNODE) {
        for (let i = 0, l = node.childNodes.length; i < l; i++) {
            diffPrev(
                node.childNodes[i],
                options,
                childrenNeedRemove
                    ? false
                    : insideRemove || childrenRemoved
            );
        }
    }
}

function diff(nextNode: VirtualDomNode, node: VirtualDomNode, options: Partial<Options> = {}) {
    const patch = new Patch(options.document);
    const nodesById = options.nodesById || groupByIdNodes(node, {});
    const nextNodesById = options.nextNodesById || groupByIdNodes(nextNode, {});

    diffNext(nextNode, {
        nodesById,
        patch
    });

    diffPrev(node, {
        nextNodesById,
        patch
    });

    return patch;
}

export { diff };
