import crypto from 'crypto';

const getFunctionName = (function getFunctionName() {
    if (getFunctionName.name) {
        return fn => fn.name;
    } else {
        return fn => fn.toString().match(/^function\s*([^\s(]+)/)[1];
    }
})();

const SKIP_HOIST = {
        defaults: true,
        uniqid: true,
        antibind: true
    },
    NEXT_TICK_TIMEOUT = 0;

function getHash(string) {
    return crypto
        .createHash('md5')
        .update(string, 'utf8')
        .digest('hex');
}

const REGEXP_ATTR = /[<>"&]/;
const REGEXP_HTML = /[<>&]/;

function escapeHtmlHeavy(value) {
    return value
        .replace(/&/g, '&amp;')
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
function shallowEqual(obj1, obj2) {
    if (obj1 === obj2) {
        return true;
    } else if (typeof obj1 !== typeof obj2) {
        return false;
    } else {
        const obj1Keys = Object.keys(obj1);

        for (let i = 0, l = obj1Keys.length; i < l; i++) {
            let name = obj1Keys[i];

            if (obj1[name] === obj2[name]) {
                continue;
            } else if (typeof obj1[name] !== typeof obj2[name]) {
                return false;
            } else if (Array.isArray(obj1[name]) && Array.isArray(obj2[name])) {
                let array1 = obj1[name],
                    array2 = obj2[name];

                if (array1.length !== array2.length) {
                    return false;
                }

                for (let i = 0, l = array1.length; i < l; i++) {
                    if (array1[i] !== array2[i]) {
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

function shallowEqualArray(array1, array2) {
    if (array1 === array2) {
        return true;
    }

    if (array1.length !== array2.length) {
        return false;
    }

    for (let i = 0, l = array1.length; i < l; i++) {
        if (array1[i] !== array2[i]) {
            return false;
        }
    }

    return true;
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
    getFunctionName,
    getHash,
    hoistStatics,
    nextTick,
    shallowEqual,
    shallowEqualArray,
    throttle
};
