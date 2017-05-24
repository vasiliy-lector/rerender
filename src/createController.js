import { shallowEqual } from './utils';

export default function createController (Wrapper) {
    return (options, settings) => ({
        controller: Wrapper,
        options,
        settings
    });
}

export function controllersEqual(obj1, obj2) {
    return obj1.controller ===  obj2.controller
        && (obj1.options === obj2.options || shallowEqual(obj1.options, obj2.options));
}
