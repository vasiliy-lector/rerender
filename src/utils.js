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

function escapeHtml(data) {
    return typeof data === 'string'
        ? data
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
        : escapeHtml(data + '');
}

function escape(data) {
    return typeof data === 'string'
        ? data
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
        : escape(data + '');
}

// TODO: arrays same if same all items
function isSameProps(nextProps, props) {
    return nextProps === props || !Object.keys(nextProps).some(name => nextProps[name] !== props[name]);
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

export { debug, escape, escapeHtml, getHash, getKey, hoistStatics, isEmptyObject, isSameProps };
