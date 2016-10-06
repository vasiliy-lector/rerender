const UNDEFINED = void 0;

class Parser {
    constructor(exec) {
        this.exec = exec;
    }

    then(transform) {
        const exec = this.exec;

        return new Parser(function (string, position) {
            var executed = exec(string, position);

            return executed && {
                result: transform(executed.result),
                end: executed.end
            };
        });
    }

    not(pattern) {
        const exec = this.exec;

        return new Parser(function (string, position) {
            return !pattern.exec(string, position) ? exec(string, position) : UNDEFINED;
        });
    }
}

function find(pattern) {
    if (typeof pattern === 'string') {
        return new Parser(function (string, position) {
            if (string.substr(position, pattern.length) === pattern) {
                return {
                    result: pattern,
                    end: position + pattern.length
                };
            }
        });
    } else {
        return new Parser(function (string, position) {
            var match = pattern.exec(string.slice(position));
            if (match && match.index === 0) {
                return {
                    result: match[0],
                    end: position + match[0].length
                };
            }
        });
    }
}

function optional(pattern) {
    return new Parser(function (string, position) {
        return pattern.exec(string, position) || {
            result: UNDEFINED,
            end: position
        };
    });
}

function required(pattern) {
    return new Parser(function (string, position) {
        return pattern.exec(string, position) || error(string, position);
    });
}

function any() {
    const patterns = Array.prototype.slice.call(arguments);

    return new Parser(function (string, position) {
        let executed;

        for (let i = 0, l = patterns.length; i < l && !executed; i++) {
            executed = patterns[i].exec(string, position);
        }

        return executed;
    });
}

function sequence() {
    const patterns = Array.prototype.slice.call(arguments);

    return new Parser(function (string, position) {
        let executed,
            end = position,
            result = [];

        for (let i = 0, l = patterns.length; i < l; i++) {
            executed = patterns[i].exec(string, end);
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

    return new Parser(function (string, position) {
        let result = [],
            end = position,
            executed = mainPattern.exec(string, end);

        while (executed && executed.end > end) {
            result.push(executed.result);
            end = executed.end;
            executed = pattern.exec(string, end);
        }

        return result && {
            result,
            end
        };
    });
}

function deffered(getPattern) {
    let pattern;

    return new Parser(function(str, pos) {
        return (pattern || (pattern = getPattern())).exec(str, pos);
    });
}

function error(string, position) {
    const beginPos = position - 20 < 0 ? 0 : position - 20;

    throw new Error(`Unexpected symbol
        '${string.slice(beginPos, position)}***${string[position]}***${string.slice(position + 1, position + 5)}'
        on position ${position}`);
}

export {
    Parser,
    any,
    find,
    optional,
    repeat,
    required,
    sequence,
    deffered
};
