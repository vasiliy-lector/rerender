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

    // renderChildNodes(config, context) {
    //     if (!this.children) {
    //         return null;
    //     }
    //
    //     let childNodes = [];
    //
    //     for (let i = 0, l = children.length; i < l; i++) {
    //         const item = this.children[i];
    //         const type = typeof item;
    //
    //         if (type === 'object' && item.type === TEMPLATE) {
    //             childNodes.push(item.render(config, context));
    //         } else if (Array.isArray(item)) {
    //             for (let j = 0, l1 = item.length; j < l1; j++) {
    //                 childNodes.push(renderChildren(item[j], config, context));
    //             }
    //         } else {
    //             childNodes.push(
    //                 new VText(item || '', context.parentNode, context.parentDomNode)
    //             );
    //         }
    //     }
    //
    //     return childNodes;
    //  },

    render(config, context) {
        const nextNode = new VNode(this.instance, this.props, context.parentNode, context.parentDomNode);
        // const childContext = context.setParent(nextNode, nextNode);
        // const childNodes = this.renderChildNodes(config, childContext);
        // nextNode.setChildNodes(childNodes);

        return nextNode;
    }
};

// function renderChildren(item, config, context) {
//     if (type === 'object' && item.type === TEMPLATE) {
//         childNodes.push(item.render(config, context));
//     } else if (Array.isArray(item)) {
//         for (let j = 0, l1 = item.length; j < l1; j++) {
//             childNodes.push(renderChildren(item[j], config, context));
//         }
//     } else {
//         childNodes.push(
//             new VText(item || '', context.parentNode, context.parentDomNode)
//         );
//     }
// }

export default TemplateVNode;
