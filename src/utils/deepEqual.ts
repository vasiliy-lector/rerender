/* tslint:disable object-literal-key-quotes */
import { Map } from '../types';
const directEqual: Map<boolean> = {
    'number': true,
    'string': true,
    'boolean': true,
    'function': true,
    'undefined': true
};

export function deepEqual(obj1: any, obj2: any) {
    if (obj1 === obj2) {
        return true;
    } else if (typeof obj1 !== typeof obj2) {
        return false;
    } else if (directEqual[typeof obj1] || obj1 === null) {
        return obj1 === obj2;
    } else if (Array.isArray(obj1)) {
        if (!Array.isArray(obj2) || obj1.length !== obj2.length) {
            return false;
        }

        for (let i = 0, l = obj1.length; i < l; i++) {
            const equal = deepEqual(obj1[i], obj2[i]);

            if (!equal) {
                return false;
            }
        }
    } else if (typeof obj1 === 'object') {
        if (typeof obj2 !== 'object') {
            return false;
        }
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);

        if (keys1.length !== keys2.length) {
            return false;
        }

        for (let i = 0, l = keys1.length; i < l; i++) {
            const equal = deepEqual(obj1[keys1[i]], obj2[keys1[i]]);

            if (!equal) {
                return false;
            }
        }
    }

    return true;
}
