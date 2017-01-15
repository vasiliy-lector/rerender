function Template(template) {
    this.template = template;
}

Template.prototype = {
    exec(position) {
        return this.template(position);
    },
    type: 'Template'
};

// function VText(value) {
//     this.value = value;
// }
//
// VText.prototype = {
//     type: 'VText'
// };
//
// function VNode(tag, attrs, children) {
//     this.tag = tag;
//     this.attrs = attrs;
//     this.children = children;
// }
//
// VNode.prototype = {
//     type: 'VNode'
// };

function template(template) {
    return new Template(template);
}

export default template;
