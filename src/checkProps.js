import Component from './Component';
import { debug } from './utils';

const
    SIMPLE_TYPES = {
        'string': true,
        'boolean': true,
        'number': true,
        'function': true
    },
    getPropType = function(prop) {
        if (Array.isArray(prop)) {
            return 'array';
        } else if (SIMPLE_TYPES[typeof prop]) {
            return typeof prop;
        } else if (typeof prop === 'object') {
            if (prop instanceof Component) {
                return 'component';
            } else if (prop === null) {
                return 'null';
            } else {
                return 'object';
            }
        } else {
            return typeof prop;
        }
    },
    checkProps = function(props = {}, component, position) {
        let {
            types = {},
            required = {},
            name: componentName
        } = component;

        Object.keys(types).forEach(name => {
            let type = getPropType(props[name]);

            if (props[name] && type !== types[name]) {
                debug[ required[name] ? 'error' : 'warn' ](`Component ${componentName} (${position}) expected property ${name} of type ${types[name]} but ${type} given`);
            } else if (types[name] && !props[name]) {
                debug.error(`Component ${componentName} (${position}) required property ${name} of type ${types[name]}`);
            }
        });

    };

export default checkProps;
