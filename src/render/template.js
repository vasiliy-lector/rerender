import { shallowEqual } from '../utils';

let cacheIndex = 0;

function CachedTemplates() {
    this.byCacheIndex = [];
}

CachedTemplates.prototype = {
    set(index, template) {
        const templates = this.byCacheIndex[index] || (this.byCacheIndex[index] = []);
        templates.push(template);

        return template;
    },

    get(index, values) {
        const candidates = this.byCacheIndex[index];

        for (let i = 0, l = candidates.length; i < l; i++) {
            if (shallowEqual(candidates[i].values, values)) {
                return candidates[i];
            }
        }
    }
};

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

function template(config, jsx) {
    return function(fn, values) {
        const index = fn.cacheIndex || (fn.cacheIndex = ++cacheIndex);
        const { cachedTemplates, nextCachedTemplates } = config;
        const cachedTemplate = cachedTemplates && cachedTemplates.get(index, values);

        return nextCachedTemplates.set(index, cachedTemplate || new Template(fn, values, jsx));
    };
}

export default template;
export { CachedTemplates };
