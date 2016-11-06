import { getStringsId } from './parserUtils';

const UNDEFINED = void 0,
    NEED_EXPAND_TYPES = {
        object: true,
        function: true
    };

function configure() {}

function expandCache(cached, values) {
    if (typeof cached === 'function') {
        return cached(values);
    } else {
        return cached.map(result => NEED_EXPAND_TYPES[typeof result] ? expandCache(result, values) : result);
    }
}

function hasFunctions(cached) {
    for (let i = 0, l = cached.length; i < l; i++) {
        if (typeof cached[i] === 'function' || (Array.isArray(cached[i]) && hasFunctions(cached[i]))) {
            return true;
        }
    }
}

class Parser {
    constructor(exec) {
        this.exec = exec;
    }

    not(pattern) {
        const exec = this.exec;

        return new Parser(function (strings, position, options) {
            return !pattern.exec(strings, position, options) ? exec(strings, position, options) : false;
        });
    }

    execWithTransforms(strings, position, options) {
        const executed = this.originalExec(strings, position, options);

        if (!executed) {
            return false;
        }

        let result = executed.result,
            needExpand;

        if (Array.isArray(result)) {
            needExpand = hasFunctions(result);
        } else if (typeof result === 'function') {
            needExpand = true;
        } else {
            needExpand = false;
        }

        if (this.cachedTransforms) {
            result = this.cachedTransforms.reduce((memo, transform) => transform(memo), result);
        }

        return {
            result: this.transforms ? values => this.transforms.reduce((memo, transform) => transform(memo, values), needExpand ? expandCache(result, values) : result) : result,
            end: executed.end
        };
    }

    then(transform, useCache) {
        if (!this.transforms || !this.cachedTransforms) {
            this.originalExec = this.exec;
            this.exec = this.execWithTransforms.bind(this);
            if (useCache) {
                this.cachedTransforms = [];
            } else {
                this.transforms = [];
            }
        }

        if (useCache) {
            this.cachedTransforms.push(transform);
        } else {
            this.transforms.push(transform);
        }

        return this;
    }

    parse(string, values) {
        const strings = typeof string === 'string' ? [string] : string,
            position = [0, 0],
            stringsId = getStringsId(strings);
        this.cache = this.cache || {};

        let cached = this.cache[stringsId];

        if (cached === UNDEFINED) {
            cached = (this.exec(strings, position) || {}).result || false;
            this.cache[stringsId] = cached;
        }

        return cached ? expandCache(cached, values) : UNDEFINED;
    }
}

function find(pattern) {
    if (typeof pattern === 'string') {
        const length = pattern.length;

        return new Parser(function (strings, position) {
            if (strings[position[0]].substr(position[1], length) === pattern) {
                return {
                    result: pattern,
                    end: [position[0], position[1] + length]
                };
            }

            return false;
        });
    } else {
        return new Parser(function (strings, position) {
            var match = pattern.exec(strings[position[0]].slice(position[1]));
            if (match && match.index === 0) {
                return {
                    result: match[0],
                    end: [position[0], position[1] + match[0].length]
                };
            }

            return false;
        });
    }
}

function optional(pattern) {
    return new Parser(function (strings, position, options) {
        return pattern.exec(strings, position, options) || {
            result: UNDEFINED,
            end: position
        };
    });
}

function required(pattern) {
    return new Parser(function (strings, position, options) {
        return pattern.exec(strings, position, options) || error(strings[position[0]], position[1]);
    });
}

function any() {
    const patterns = Array.prototype.slice.call(arguments);

    return new Parser(function (strings, position, options) {
        let executed, i, l;

        for (i = 0, l = patterns.length; i < l && !executed; i++) {
            executed = patterns[i].exec(strings, position, options);
        }

        return executed;
    });
}

function sequence() {
    const patterns = Array.prototype.slice.call(arguments);

    return new Parser(function (strings, position, options) {
        let executed,
            end = position;
        const result = [];

        for (let i = 0, l = patterns.length; i < l; i++) {
            executed = patterns[i].exec(strings, end, options);
            if (!executed) {
                return false;
            }
            result.push(executed.result);
            end = executed.end;
        }

        return {
            result,
            end
        };
    });
}

function repeat(mainPattern, delimeter) {
    const pattern = !delimeter
        ? mainPattern
        : sequence(delimeter, mainPattern).then(value => value[1], true);

    return new Parser(function (strings, position, options) {
        let result = [],
            end = position,
            executed = mainPattern.exec(strings, end, options);

        while (executed !== false && (executed.end[1] > end[1] || executed.end[0] > end[0])) {
            result.push(executed.result);
            end = executed.end;
            executed = pattern.exec(strings, end, options);
        }

        return result.length > 0 && {
            result,
            end
        };
    });
}

function deffered(getPattern) {
    let pattern;

    return new Parser(function(strings, position, options) {
        return (pattern || (pattern = getPattern())).exec(strings, position, options);
    });
}

function error(string, position) {
    const beginPos = position - 20 < 0 ? 0 : position - 20;

    throw new Error(`Unexpected symbol
        '${string.slice(beginPos, position)}***${string[position]}***${string.slice(position + 1, position + 5)}'
        in position ${position}`);
}

function next() {
    return new Parser(function(strings, position) {
        if (!strings[position[0]][position[1]]) {
            const nextPosition0 = position[0] + 1;

            return strings[nextPosition0] !== UNDEFINED ? {
                result: position[0],
                end: [nextPosition0, 0]
            } : false;
        }

        return false;
    });
}

function end() {
    return new Parser(function(strings, position) {
        return !strings[position[0]][position[1]] && strings[position[0] + 1] === UNDEFINED ? {
            result: '',
            end: position
        } : false;
    });
}

export {
    Parser,
    any,
    configure,
    next,
    end,
    find,
    optional,
    repeat,
    required,
    sequence,
    deffered
};
