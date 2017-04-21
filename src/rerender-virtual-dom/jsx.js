var parser = require('nano-parser'),
    any = parser.any,
    end = parser.end,
    find = parser.find,
    next = parser.next,
    optional = parser.optional,
    repeat = parser.repeat,
    required = parser.required,
    test = parser.test,
    sequence = parser.sequence,
    defer = parser.defer,

    defaultOutput = function defaultOutput(tag, attrs, children) {
        return {
            tag: tag,
            attrs: attrs,
            children: children
        };
    },
    outputMethod = defaultOutput,

    whiteSpace = find(/^\s+/),
    optionalWhiteSpace = optional(whiteSpace),
    textNode = find(/^[^<]+/),
    tagName = find(/^[a-zA-Z][a-zA-Z0-9]*/),
    placeholder = next(),
    attrName = find(/^[a-zA-Z_][a-zA-Z0-9\-]*/),
    booleanAttr = attrName.then(function(result) { return function(memo) {
        memo[result] = true;
    };}),
    quotedAttr = sequence(
        attrName,
        find('='),
        any(
            sequence(
                find('\''),
                find(/[^']*/),
                required(find('\''))
            ),
            sequence(
                find('"'),
                find(/[^"]*/),
                required(find('"'))
            )
        )
    ).then(function(result) { return function(memo) {
        memo[result[0]] = result[2][1];
    };}),
    attrWithPlaceholder = sequence(
        attrName,
        find('='),
        any(
            placeholder,
            sequence(
                find('\''),
                placeholder,
                required(find('\''))
            ).then(function(result) {
                return result[1];
            }),
            sequence(
                find('"'),
                placeholder,
                required(find('"'))
            ).then(function(result) {
                return result[1];
            })
        )
    ).then(function(result) { return function(memo, values) {
        memo[result[0]] = values[result[2]];
    };}),
    attrs = repeat(
        any(
            placeholder.then(function(index) { return function(memo, values) {
                for (var key in values[index]) {
                    memo[key] = values[index][key];
                }
            };}),
            attrWithPlaceholder,
            quotedAttr,
            booleanAttr
        ),
        whiteSpace
    ).then(function(results) { return function(values) {
        var memo = {};

        for (var i = 0, l = results.length; i < l; i++) {
            results[i](memo, values);
        }

        return memo;
    };}),
    component = sequence(
        find('<').not(find('</')),
        required(any(
            tagName,
            placeholder.then(function(index) { return function(values) {
                return values[index];
            };})
        )),
        optional(sequence(
            whiteSpace,
            attrs
        )).then(function(result) { return function(values) {
            return result ? result[1](values) : null;
        };}),
        optionalWhiteSpace,
        required(any(
            find('/>').then(function() { return null; }),
            sequence(
                required(find('>')),
                optionalWhiteSpace,
                optional(any(
                    sequence(
                        repeat(defer(function() { return component; }), optionalWhiteSpace),
                        test(find(/^\s*<\//))
                    ).then(function(result) {
                        return result[0];
                    }).not(find(/^[^<]+/)),
                    repeat(any(
                        placeholder.then(function (index) { return function(values) {
                            return values[index];
                        };}),
                        textNode,
                        defer(function() { return component; })
                    ))
                )),
                optionalWhiteSpace,
                required(sequence(
                    find('</'),
                    any(
                        tagName,
                        placeholder
                    ),
                    optionalWhiteSpace,
                    find('>')
                ))
            ).then(function(result) { return function(memo, values) {
                var items = result[2] || [];

                for (var i = 0, l = items.length; i < l; i++) {
                    var item = items[i];
                    memo.push(typeof item === 'function' ? item(values) : item);
                }
            };})
        ))
    ).then(function(result) { return function(values) {
        const memo = [
            typeof result[1] === 'function' ? result[1](values) : result[1],
            result[2](values)
        ];

        if (typeof result[4] === 'function') {
            result[4](memo, values);
        }

        return outputMethod.apply(null, memo);
    };}),

    root = sequence(
        optionalWhiteSpace,
        component,
        optionalWhiteSpace,
        end()
    ).useCache().then(function(result, values) {
        return result[1](values);
    }),

    jsx = function jsx(templates) {
        for (var i = 1, l = arguments.length, values = Array(l - 1); i < l; i++) {
            values[i - 1] = arguments[i];
        }

        return root.parse(templates, values);
    };

jsx.setOutputMethod = function setOutputMethod(method) {
    outputMethod = method || defaultOutput;
};

module.exports = jsx;
