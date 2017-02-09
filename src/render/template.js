import { shallowEqual } from '../utils';

function Template(fn, values, jsx) {
    this.fn = fn;
    this.values = values;
    this.jsx = jsx;
}

Template.prototype = {
    exec(position) {
        return this.fn(this.values, position, this.jsx);
    },
    type: 'Template'
};

function template(fn, values) {
    const index = ++this.index;
    const cachedTemplate = this.cachedTemplates[index];

    if (!cachedTemplate || cachedTemplate.fn !== fn || !shallowEqual(cachedTemplate.values, values)) {
        return (this.cachedTemplates[index] = new Template(fn, values, this));
    } else {
        return cachedTemplate;
    }

}

export default template;
