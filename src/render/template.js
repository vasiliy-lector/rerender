import { shallowEqualArray } from '../utils';

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

        if (candidates !== undefined) {
            for (let i = 0, l = candidates.length; i < l; i++) {
                if (shallowEqualArray(candidates[i].values, values)) {
                    return candidates[i];
                }
            }
        }
    }
};

function Template(fn, values) {
    this.fn = fn;
    this.values = values;
}

Template.prototype = {
    exec(position, jsx) {
        return this.fn(this.values, position, jsx);
    },
    type: 'Template'
};

function template(config, jsx) {
    if (config.stringify) {
        return templateStringify(config, jsx);
    } else {
        return templateDom(config, jsx);
    }
}

function templateDom(config) {
    return function(fn, values) {
        const index = fn.cacheIndex || (fn.cacheIndex = ++cacheIndex);
        const { cachedTemplates, nextCachedTemplates } = config;
        const cachedTemplate = cachedTemplates && cachedTemplates.get(index, values);

        return nextCachedTemplates.set(index, cachedTemplate || new Template(fn, values));
    };
}

function templateStringify() {
    return function(fn, values) {
        return new Template(fn, values);
    };
}

export default template;
export { CachedTemplates };
