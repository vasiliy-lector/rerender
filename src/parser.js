import { getStringsId } from './parserUtils';

const CACHE_FULL = 'CACHE_FULL',
    CACHE_NEGATIVE = 'CACHE_NEGATIVE',
    CACHE_OPTIONAL = 'CACHE_OPTIONAL',
    execByCacheType = {
        [CACHE_FULL]: 'execCached',
        [CACHE_OPTIONAL]: 'execCachedOptional',
        [CACHE_NEGATIVE]: 'execCachedNegative'
    };

let cacheEnabled = true,
    autoCacheEnabled = false,
    autoCacheIndexEnabled = false,
    autoCacheOptionalEnabled = false;

function configure(key, value) {
    switch(key) {
        case 'cacheEnabled':
            cacheEnabled = value;
            break;
        case 'autoCacheEnabled':
            autoCacheEnabled = value;
            break;
        case 'autoCacheIndexEnabled':
            autoCacheIndexEnabled = value;
            break;
        case 'autoCacheOptionalEnabled':
            autoCacheOptionalEnabled = value;
            break;
    }
}

class Parser {
    constructor(exec, useCache) {
        this.globalCacheEnabled = cacheEnabled;

        if (useCache && this.globalCacheEnabled) {
            this.originalExec = exec;
            this.useCacheOption = useCache;
            this.exec = (this[execByCacheType[useCache]] || exec).bind(this);
        } else {
            this.exec = exec;
        }
    }

    execCached(strings, position, options) {
        return options.cache
            ? options.cache[++options.cacheIndex]
            : options.disableCache
                ? this.originalExec(strings, position, options)
                : (options.nextCache[++options.cacheIndex] = this.originalExec(strings, position, { disableCache: true, values: options.values }));
    }

    execCachedOptional(strings, position, options) {
        return options.cache
            ? options.cache[++options.cacheIndex] || this.originalExec(strings, position, options)
            : options.disableCache
                ? this.originalExec(strings, position, options)
                : this.buildCacheOptional(strings, position, options);
    }

    buildCacheOptional(strings, position, options) {
        const cacheIndex = ++options.cacheIndex;
        options.nextCache[cacheIndex] = undefined;
        const cached = this.originalExec(strings, position, options);

        if (cached && !cached.result) {
            options.cacheIndex = cacheIndex;
            options.nextCache[cacheIndex] = cached;
            options.nextCache.length = cacheIndex + 1;
        }

        return cached;
    }

    execCachedNegative(strings, position, options) {
        return options.cache
            ? options.cache[++options.cacheIndex] && this.originalExec(strings, position, options)
            : options.disableCache
                ? this.originalExec(strings, position, options)
                : this.buildCacheNegative(strings, position, options);
    }

    buildCacheNegative(strings, position, options) {
        const cacheIndex = ++options.cacheIndex;
        options.nextCache[cacheIndex] = true;
        const cached = this.originalExec(strings, position, options);

        if (!cached) {
            options.cacheIndex = cacheIndex;
            options.nextCache[cacheIndex] = cached;
            options.nextCache.length = cacheIndex + 1;
        }

        return cached;
    }

    useCache(type = CACHE_FULL) {
        return this.useCacheOption && this.useCacheOption === type
            ? this
            : new Parser(this.originalExec || this.exec, type);
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
            position = [0, 0];

        let cache, nextCache, cacheIndex;

        if (this.globalCacheEnabled) {
            cacheIndex = -1;
            const stringsId = getStringsId(strings);
            cache = (this.cache || (this.cache = {}))[stringsId];
            if (!cache) {
                nextCache = (this.cache[stringsId] = []);
            }
        }

        return (this.exec(strings, position, { values, cache, nextCache, cacheIndex }) || {}).result;
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
        }, autoCacheEnabled && CACHE_FULL);
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
        }, autoCacheEnabled && CACHE_FULL);
    }
}

function optional(pattern) {
    return new Parser(function (strings, position, options) {
        return pattern.exec(strings, position, options) || {
            result: undefined,
            end: position
        };
    }, autoCacheOptionalEnabled && CACHE_OPTIONAL);
}

function required(pattern) {
    return new Parser(function (strings, position, options) {
        return pattern.exec(strings, position, options) || error(strings[position[0]], position[1]);
    });
}

function any(...patterns) {
    const useCache = autoCacheIndexEnabled && cacheEnabled,
        length = patterns.length;

    return new Parser(function (strings, position, options) {
        let executed = false;

        if (useCache) {
            if (options.cache) {
                return patterns[options.cache[++options.cacheIndex]].exec(strings, position, options);
            } else if (!options.disableCache) {
                let i, l;
                const cacheIndex = options.cacheIndex + 1;
                options.nextCache[cacheIndex] = undefined;

                for (i = 0, l = length; i < l && !executed; i++) {
                    if (options.cacheIndex > cacheIndex) {
                        options.nextCache.length = cacheIndex + 1;
                        options.cacheIndex = cacheIndex;
                    }
                    executed = patterns[i].exec(strings, position, options);
                }

                options.nextCache[cacheIndex] = i - 1;

                return executed;
            }
        }

        for (let i = 0, l = length; i < l && !executed; i++) {
            executed = patterns[i].exec(strings, position, options);
        }

        return executed;
    });
}

function sequence(...patterns) {
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

            return strings[nextPosition0] !== undefined ? {
                result: position[0],
                end: [nextPosition0, 0]
            } : false;
        }

        return false;
    }, autoCacheEnabled && CACHE_FULL);
}

function end() {
    return new Parser(function(strings, position) {
        return !strings[position[0]][position[1]] && strings[position[0] + 1] === undefined ? {
            result: '',
            end: position
        } : false;
    }, autoCacheEnabled && CACHE_FULL);
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
    deffered,
    CACHE_FULL,
    CACHE_OPTIONAL,
    CACHE_NEGATIVE
};
