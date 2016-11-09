import { getStringsId } from './parserUtils';

const UNDEFINED = void 0,
    USE_CACHE = true,
    USE_CACHE_NEGATIVE = 'USE_CACHE_NEGATIVE';

let cacheEnabled = true,
    autoCacheEnabled = true,
    autoCacheNegativeEnabled = true;

function configure(key, value) {
    switch(key) {
        case 'cacheEnabled':
            cacheEnabled = value;
            break;
        case 'autoCacheEnabled':
            autoCacheEnabled = value;
            break;
        case 'autoCacheNegativeEnabled':
            autoCacheNegativeEnabled = value;
            break;
    }
}

class Parser {
    constructor(exec, useCache) {
        this.globalCacheEnabled = cacheEnabled;

        if (useCache && this.globalCacheEnabled) {
            this.originalExec = exec;
            this.useCacheOption = useCache;
            this.exec = this.execCached.bind(this);
        } else {
            this.exec = exec;
        }
    }

    execCached(strings, position, options) {
        let cached = options.cache[options.cacheIndex++];

        if (cached === UNDEFINED) {
            let negative = this.useCacheOption === USE_CACHE_NEGATIVE;
            const cacheIndex = options.cacheIndex;
            cached = this.originalExec(strings, position, options);

            if (!negative || (negative && (cached === false || (cached && !cached.result)))) {
                options.cache.length = cacheIndex - 1;
                options.cacheIndex = cacheIndex;
                options.cache.push(cached);
            }
        }

        return cached;
    }

    useCache() {
        return this.useCacheOption && this.useCacheOption !== 'USE_CACHE_NEGATIVE'
            ? this
            : new Parser(this.originalExec || this.exec, USE_CACHE);
    }

    useCacheNegative() {
        return this.useCacheOption === 'USE_CACHE_NEGATIVE'
            ? this
            : new Parser(this.originalExec || this.exec, USE_CACHE_NEGATIVE);
    }

    not(pattern) {
        const exec = this.exec;

        return new Parser(function (strings, position, options) {
            return !pattern.exec(strings, position, options) ? exec(strings, position, options) : false;
        });
    }

    then(transform) {
        const exec = this.exec;

        return new Parser(function (strings, position, options) {
            const executed = exec(strings, position, options);

            return executed && {
                result: transform(executed.result, options.values),
                end: executed.end
            };
        });
    }

    parse(string, values) {
        const strings = typeof string === 'string' ? [string] : string,
            position = [0, 0],
            cacheIndex = 0;

        let cache;

        if (this.globalCacheEnabled) {
            const stringsId = getStringsId(strings);
            cache = (this.cache || (this.cache = {}))[stringsId] || [];
        }

        return (this.exec(strings, position, { values, cache, cacheIndex }) || {}).result;
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
        }, autoCacheEnabled && USE_CACHE);
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
        }, autoCacheEnabled && USE_CACHE);
    }
}

function optional(pattern) {
    return new Parser(function (strings, position, options) {
        return pattern.exec(strings, position, options) || {
            result: UNDEFINED,
            end: position
        };
    }, autoCacheNegativeEnabled && USE_CACHE_NEGATIVE);
}

function required(pattern) {
    return new Parser(function (strings, position, options) {
        return pattern.exec(strings, position, options) || error(strings[position[0]], position[1]);
    });
}

function any() {
    const patterns = Array.prototype.slice.call(arguments);
    let useCache;

    if (false && cacheEnabled) {
        useCache = true;
    }

    return new Parser(function (strings, position, options) {
        let executed;

        if (useCache) {
            const { cacheIndex } = options;
            options.cacheIndex = cacheIndex + 1;
            let cached = options.cache[cacheIndex];

            if (cached !== UNDEFINED) {
                return patterns[cached].exec(strings, position, options);
            } else {
                let i, l;

                for (i = 0, l = patterns.length; i < l && !executed; i++) {
                    executed = patterns[i].exec(strings, position, options);
                }

                options.cache.length = cacheIndex;
                options.cacheIndex = cacheIndex + 1;
                options.cache.push(i - 1);
            }
        } else {
            for (let i = 0, l = patterns.length; i < l && !executed; i++) {
                executed = patterns[i].exec(strings, position, options);
            }
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
        : sequence(delimeter, mainPattern).then(value => value[1]);

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
    }, autoCacheEnabled && USE_CACHE);
}

function end() {
    return new Parser(function(strings, position) {
        return !strings[position[0]][position[1]] && strings[position[0] + 1] === UNDEFINED ? {
            result: '',
            end: position
        } : false;
    }, autoCacheEnabled && USE_CACHE);
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
