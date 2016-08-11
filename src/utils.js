import crypto from 'crypto';

const SKIP_HOIST = {
    defaults: true,
    required: true,
    types: true,
    singleton: true,
    autoBind: true
};

function isEmptyObject(item) {
    return !item
        || typeof item !== 'object'
        || !Object.keys(item).length;
}

function getHash(string) {
    return crypto
        .createHash('md5')
        .update(string, 'utf8')
        .digest('hex');
}

function getKey(id) {
    return getHash(id).slice(0, 8);
}

function escape(data) {
    return typeof data === 'string'
        ? data
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;')
        : escape(data + '');
}

function hoistStatics(Target, Source) {
    for( let name in Source ) {
        if (Source.hasOwnProperty(name) && !SKIP_HOIST[name]) {
            Target[name] = Source[name];
        }
    }

    return Target;
}

// TODO
const debug = console;

export { debug, escape, hoistStatics, isEmptyObject, getHash, getKey };
