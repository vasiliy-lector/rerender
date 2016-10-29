const UNDEFINED = void 0,
    globalConfig = {
        cacheDisabled: false
    },
    stringIds = {};

let lastStringId = 0;

function configure(key, value) {
    globalConfig[key] = value;
}

function getCacheId(stringsId, position) {
    return (stringsId << 21) | (position[0] << 13) | position[1];
}

function getStringsId(strings) {
    let i = strings.length,
        hash = 0;

    while (i) {
        let string = strings[--i],
            j = string.length;
        while (j) {
            hash = (((hash << 5) - hash) + string.charCodeAt(--j)) | 0;
        }
    }

    return stringIds[hash] || (stringIds[hash] = ++lastStringId);
}

class Parser {
    constructor(exec, useCache) {
        if (useCache && !globalConfig.cacheDisabled) {
            const cache = {};
            this.exec = function(strings, position, options) {
                const cacheId = getCacheId(options.stringsId, position);
                let cached = cache[cacheId];

                if (cached === UNDEFINED) {
                    cached = exec(strings, position, options);
                    cache[cacheId] = cached;
                }

                return cached;
            };
            this.cached = true;
        } else {
            this.exec = exec;
        }
    }

    useCache() {
        return this.cached ? this : new Parser(this.exec, true);
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

        let stringsId;

        if (!globalConfig.cacheDisabled) {
            stringsId = getStringsId(strings);
        }

        return (this.exec(strings, position, { values, stringsId }) || {}).result;
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
        }, true);
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
        }, true);
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
    const patterns = Array.prototype.slice.call(arguments),
        cache = {};

    return new Parser(function (strings, position, options) {
        let executed;
        const
            cacheId = getCacheId(options.stringsId, position),
            cached = cache[cacheId];

        if (cached !== UNDEFINED) {
            executed = patterns[cached].exec(strings, position, options);
        } else {
            let i, l;

            for (i = 0, l = patterns.length; i < l && !executed; i++) {
                executed = patterns[i].exec(strings, position, options);
            }

            globalConfig.cacheDisabled || (cache[cacheId] = i - 1);
        }

        return executed || false;
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

        while (executed !== false && (executed.end[0] > end[0] || executed.end[1] > end[1])) {
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
    }, true);
}

function end() {
    return new Parser(function(strings, position) {
        return !strings[position[0]][position[1]] && strings[position[0] + 1] === UNDEFINED ? {
            result: '',
            end: position
        } : false;
    }, true);
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
