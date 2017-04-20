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

    renderAttrs() {
        // let attrs = '';
        // const setted = {};
        //
        // if (this.props) {
        //     for (let i = this.props.length - 1; i > 0; i = i - 2) {
        //         const value = this.props[i];
        //         const name = this.props[i - 1];
        //         if (name === '...' && typeof value === 'object') {
        //             for (let key in value) {
        //                 if (!setted[key]) {
        //                     attrs = renderAttr(key, value[key]) + attrs;
        //                     setted[key] = true;
        //                 }
        //             }
        //         } else if (!setted[name]) {
        //             attrs = renderAttr(name, value) + attrs;
        //             setted[name] = true;
        //         }
        //     }
        // }
        //
        // return attrs;
    },

    renderChildrens(/* config */) {
        // let children = '';
        //
        // if (this.children) {
        //     for (let i = 0, l = this.children.length; i < l; i++) {
        //         children += renderChildren(this.children[i], config);
        //     }
        // }
        //
        // return children;
    },

    render(config) {
        return new VNode(this.instance, this.props);
    }
};

export default TemplateVNode;
