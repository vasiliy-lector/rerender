export type EqualityFunction = (obj1: any, obj2: any) => boolean;

export const shallowEqual: EqualityFunction = function(obj1, obj2) {
    if (obj1 === obj2) {
        return true;
    } else if (obj1 === null || obj2 === null
        || typeof obj1 !== 'object' || typeof obj2 !== 'object') {
        return false;
    } else if (Object.keys(obj1).length !== Object.keys(obj2).length) {
        return false;
    }

    let name;
    for (name in obj1) {
        if (obj1[name] !== obj2[name]) {
            return false;
        }
    }

    return true;
};
