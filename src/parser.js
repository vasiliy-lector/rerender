let cacheEnabled = true;

function configure(key, value) {
    switch(key) {
        case 'cacheEnabled':
            cacheEnabled = value;
            break;
    }
}

function getHash(strings) {
    let i = strings.length,
        result = '' + i;

    while (i--) {
        result += strings[i];
    }

    return result;
}

class Parser {
    constructor(exec, useCache) {
        this.globalCacheEnabled = cacheEnabled;

        if (useCache && this.globalCacheEnabled) {
            this.useCacheOption = useCache;
            this.originalExec = exec;
            this.exec = this.execCached.bind(this);
        } else {
            this.exec = exec;
        }
    }

    execCached(strings, position, options) {
        return options.cache
            ? options.cache[++options.cacheIndex]
            : (options.nextCache[++options.cacheIndex] = this.originalExec(strings, position, options));
    }

    useCache(useCache = true) {
        return this.useCacheOption && this.useCacheOption === useCache
            ? this
            : new Parser(this.originalExec || this.exec, useCache);
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
            const hash = getHash(strings);
            this.cache = this.cache || {};
            cache = this.cache[hash];
            if (!cache) {
                nextCache = (this.cache[hash] = []);
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
            result: undefined,
            end: position
        };
    });
}

function required(pattern) {
    return new Parser(function (strings, position, options) {
        return pattern.exec(strings, position, options) || error(strings[position[0]], position[1]);
    });
}

function any(...patterns) {
    const length = patterns.length;

    return new Parser(function (strings, position, options) {
        let executed = false;

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
    });
}

function end() {
    return new Parser(function(strings, position) {
        return !strings[position[0]][position[1]] && strings[position[0] + 1] === undefined ? {
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
