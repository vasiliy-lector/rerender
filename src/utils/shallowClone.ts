export function shallowClone(obj: any): typeof obj {
    return Array.isArray(obj)
        ? obj.map(item => item)
        : Object.keys(obj).reduce((memo: typeof obj, name: string) => {
            memo[name] = obj[name];

            return memo;
        }, {});
}
