const UNDEFINED = void 0;

class Parser {
    constructor(exec) {
        this.exec = exec;
    }

    then(transform) {
        const exec = this.exec;

        return new Parser(function (strings, position, options) {
            const executed = exec(strings, position, options);

            return executed && {
                result: transform(executed.result, options && options.values),
                end: executed.end
            };
        });
    }

    not(pattern) {
        const exec = this.exec;

        return new Parser(function (strings, position, options) {
            return !pattern.exec(strings, position, options) ? exec(strings, position, options) : UNDEFINED;
        });
    }

    parse(string, values) {
        const strings = typeof string === 'string' ? [string] : string,
            position = [0, 0];

        return (this.exec(strings, position, { values }) || {}).result;
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
        let executed;

        for (let i = 0, l = patterns.length; i < l && !executed; i++) {
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
                return;
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

        while (executed !== UNDEFINED && (executed.end[0] > end[0] || executed.end[1] > end[1])) {
            result.push(executed.result);
            end = executed.end;
            executed = pattern.exec(strings, end, options);
        }

        return result && {
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
            } : UNDEFINED;
        }
    });
}

function end() {
    return new Parser(function(strings, position) {
        return !strings[position[0]][position[1]] && strings[position[0] + 1] === UNDEFINED ? {
            result: '',
            end: position
        } : UNDEFINED;
    });
}

export {
    Parser,
    any,
    next,
    end,
    find,
    optional,
    repeat,
    required,
    sequence,
    deffered
};
