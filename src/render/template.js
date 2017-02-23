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

// FIXME: not just by index, any cached fn may have Symbol or its unchangable index
function template(config, jsx) {
    return function(fn, values) {
        const { currentOwnerPosition, currentTemplateIndex, nextInstances } = config;
        const cachedTemplate = nextInstances[currentOwnerPosition].cachedTemplates[currentTemplateIndex];

        config.currentTemplateIndex++;
        if (!cachedTemplate || cachedTemplate.fn !== fn || !(cachedTemplate.values === values || shallowEqual(cachedTemplate.values, values))) {
            return (nextInstances[currentOwnerPosition].cachedTemplates[currentTemplateIndex] = new Template(fn, values, jsx));
        } else {
            return cachedTemplate;
        }
    };
}

export default template;
