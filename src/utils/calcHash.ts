// FIXME: optimize
export function calcHash(hash: number, ...args: string[]) {
    for (let j = 1, argsLength = args.length; j < argsLength; j++) {
        const word = args[j];
        if (typeof word !== 'string' || word.length === 0) {
            return hash;
        }

        for (let i = 0, l = word.length; i < l; i++) {
            hash  = (((hash << 5) - hash) + word.charCodeAt(i)) | 0;
        }
    }

    return hash;
}
