const UNDEFINED = void 0,
    globalConfig = {
        disableAutoCache: false
    };

function config(key, value) {
    globalConfig[key] = value;
}

class Parser {
    constructor(exec, useCache) {
        if (useCache) {
            const cache = {};
            this.exec = function(strings, position, values) {
                const cacheId = position[1] + ';' + strings[position[0]];
                if (cache[cacheId] === UNDEFINED) {
                    cache[cacheId] = exec(strings, position, values);
                }
                return cache[cacheId];
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

        return new Parser(function (strings, position, values) {
            return !pattern.exec(strings, position, values) ? exec(strings, position, values) : false;
        });
    }

    then(transform) {
        const exec = this.exec;

        return new Parser(function (strings, position, values) {
            const executed = exec(strings, position, values);

            return executed && {
                result: transform(executed.result, values),
                end: executed.end
            };
        });
    }

    parse(string, values) {
        const strings = typeof string === 'string' ? [string] : string,
            position = [0, 0];

        return (this.exec(strings, position, values) || {}).result;
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
        }, !globalConfig.disableAutoCache);
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
        }, !globalConfig.disableAutoCache);
    }
}

function optional(pattern) {
    return new Parser(function (strings, position, values) {
        return pattern.exec(strings, position, values) || {
            result: UNDEFINED,
            end: position
        };
    });
}

function required(pattern) {
    return new Parser(function (strings, position, values) {
        return pattern.exec(strings, position, values) || error(strings[position[0]], position[1]);
    });
}

function any() {
    const patterns = Array.prototype.slice.call(arguments);

    return new Parser(function (strings, position, values) {
        let executed;

        for (let i = 0, l = patterns.length; i < l && !executed; i++) {
            executed = patterns[i].exec(strings, position, values);
        }

        return executed || false;
    });
}

function sequence() {
    const patterns = Array.prototype.slice.call(arguments);

    return new Parser(function (strings, position, values) {
        let executed,
            end = position;
        const result = [];

        for (let i = 0, l = patterns.length; i < l; i++) {
            executed = patterns[i].exec(strings, end, values);
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

    return new Parser(function (strings, position, values) {
        let result = [],
            end = position,
            executed = mainPattern.exec(strings, end, values);

        while (executed !== false && (executed.end[0] > end[0] || executed.end[1] > end[1])) {
            result.push(executed.result);
            end = executed.end;
            executed = pattern.exec(strings, end, values);
        }

        return result.length > 0 && {
            result,
            end
        };
    });
}

function deffered(getPattern) {
    let pattern;

    return new Parser(function(strings, position, values) {
        return (pattern || (pattern = getPattern())).exec(strings, position, values);
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
    config,
    next,
    end,
    find,
    optional,
    repeat,
    required,
    sequence,
    deffered
};
