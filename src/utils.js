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

const REGEXP_ATTR = /[<>"&]/;
const REGEXP_HTML = /[<>]/;

function escapeHtmlHeavy(value) {
    return value
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function escapeHtml(value) {
    const string = String(value);

    if (string.length > 10) {
        return REGEXP_HTML.test(string) ? escapeHtmlHeavy(string) : string;
    } else {
        for (var i = 0, l = string.length; i < l; i++) {
            var char = string[i];
            if (char === '<' || char === '>') {
                return escapeHtmlHeavy(string);
            }
        }
    }

    return string;
}

function escapeAttrHeavy(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function escapeAttr(value) {
    const string = String(value);

    if (string.length > 10) {
        return REGEXP_ATTR.test(string) ? escapeAttrHeavy(string) : string;
    } else {
        for (var i = 0, l = string.length; i < l; i++) {
            var char = string[i];
            if (char === '<' || char === '>' || char === '"' || char === '&') {
                return escapeAttrHeavy(string);
            }
        }
    }

    return string;
}

// Objects same if them have same properties (arrays property same if same all items)
function isSameProps(nextProps, props) {
    if (nextProps === props) {
        return true;
    } else if (typeof nextProps !== typeof props) {
        return false;
    } else {
        const nextPropsKeys = Object.keys(nextProps);

        for (let i = 0, l = nextPropsKeys.length; i < l; i++) {
            let name = nextPropsKeys[i];

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

export {
    escapeAttr,
    escapeHtml,
    getHash,
    hoistStatics,
    isSameProps,
    nextTick,
    throttle
};
