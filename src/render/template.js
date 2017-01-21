function Template(template) {
    this.template = template;
}

Template.prototype = {
    exec(position) {
        return this.template(position);
    },
    type: 'Template'
};

function template(template) {
    return new Template(template);
}

export default template;
