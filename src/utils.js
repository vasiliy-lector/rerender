import crypto from 'crypto';

const SKIP_HOIST = {
        defaults: true,
        required: true,
        types: true,
        singleton: true,
        autoBind: true
    },
    NEXT_TICK_TIMEOUT = 0;

function getHash(string) {
    return crypto
        .createHash('md5')
        .update(string, 'utf8')
        .digest('hex');
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

let mesuarements = {};

function performanceStart(type) {
    if (typeof performance === 'undefined') {
        return;
    }

    mesuarements[type] = performance.now();
}

function performanceEnd(type) {
    if (typeof performance === 'undefined') {
        return;
    }

    debug.log(`${type} took ${(performance.now() - mesuarements[type]).toFixed(3)}ms`);
}

// Objects same if them have same properties (arrays property same if same all items)
function isSameProps(nextProps, props) {
    if (nextProps === props) {
        return true;
    } else if (typeof nextProps !== typeof props) {
        return false;
    } else {
        for (let name in nextProps) if (nextProps.hasOwnProperty(name)) {
            if (nextProps[name] === props[name]) {
                continue;
            } else if (typeof nextProps[name] !== typeof props[name]) {
                return false;
            } else if (Array.isArray(nextProps[name]) && Array.isArray(props[name])) {
                if (nextProps[name].length !== props[name].length) {
                    return false;
                }

                let nextArr = nextProps[name],
                    arr = props[name];

                for (let i = 0, l = nextArr.length; i < l; i++) {
                    if (nextArr[i] !== arr[i]) {
                        return false;
                    }
                }
            } else {
                return false;
            }
        }

        return true;
    }
}


function hoistStatics(Target, Source) {
    for( let name in Source ) {
        if (Source.hasOwnProperty(name) && !SKIP_HOIST[name]) {
            Target[name] = Source[name];
        }
    }

    Target.wrapper = true;

    return Target;
}

function nextTick(fn) {
    return setTimeout(fn, NEXT_TICK_TIMEOUT);
}

function throttle(fn, milliseconds, { leading }) {
    let timeout,
        called = false;

    return function() {
        if (leading && !timeout) {
            fn();
            called = true;
        }

        if (!timeout) {
            timeout = setTimeout(() => {
                timeout = undefined;

                if (!called) {
                    fn();
                }
            }, milliseconds);
        } else {
            called = false;
        }
    };
}

/* eslint-disable no-console */
const debug = {
    log() {
        console.log.apply(console, arguments);
    },
    warn() {
        console.warn.apply(console, arguments);
    },
    error() {
        console.error.apply(console, arguments);
    }
};

export {
    debug,
    escape,
    escapeHtml,
    getHash,
    hoistStatics,
    isSameProps,
    nextTick,
    performanceStart,
    performanceEnd,
    throttle
};
