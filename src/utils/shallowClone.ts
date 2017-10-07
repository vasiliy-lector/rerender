export function shallowClone(obj: any[] | { [key: string]: any }) {
    return Array.isArray(obj) ? [ ...obj ] : { ...obj };
}
