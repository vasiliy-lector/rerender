import { VROOT, VNODE, VTEXT } from './types';
import Patch, { Create, SetRef, AttachEvents, SplitText } from './Patch';

function createInitialPatch(nextNode, options, insideCreation, nextSibling) {
    if (nextNode.type === VNODE) {
        let childrenCreated;

        if (!insideCreation) {
            options.patch.push(new Create(nextNode));
            childrenCreated = true;
        }

        if (nextNode.attrs) {
            for (let name in nextNode.attrs) {
                if (name === 'ref' && typeof nextNode.attrs.ref === 'function') {
                    options.patch.pushNormalize(new SetRef(nextNode));
                } else if (name.substr(0, 2) === 'on') {
                    options.patch.pushNormalize(new AttachEvents(nextNode));
                    break;
                }
            }
        }

        for (let i = 0, l = nextNode.childNodes.length; i < l; i++) {
            createInitialPatch(
                nextNode.childNodes[i],
                options,
                insideCreation || childrenCreated,
                options.normalize ? nextNode.childNodes[i + 1] : null
            );
        }
    } else if (nextNode.type === VTEXT) {
        if (!insideCreation) {
            options.patch.push(new Create(nextNode));
        }

        if (nextSibling && nextSibling.type === VTEXT) {
            options.patch.pushNormalize(new SplitText(nextNode));
        }
    } else if (nextNode.type === VROOT) {
        const patch = new Patch();

        createInitialPatch(nextNode.childNodes[0], { ...options, patch });

        return patch;
    }
}

export default createInitialPatch;
