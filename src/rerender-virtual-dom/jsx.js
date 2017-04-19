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
        memo.push(result);
        memo.push(true);
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
        memo.push(result[0]);
        memo.push(result[2][1]);
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
        memo.push(result[0]);
        memo.push(values[result[2]]);
    };}),
    attrs = repeat(
        any(
            placeholder.then(function(index) { return function(memo, values) {
                memo.push('...');
                memo.push(values[index]);
            };}),
            attrWithPlaceholder,
            quotedAttr,
            booleanAttr
        ),
        whiteSpace
    ).then(function(results) { return function(values) {
        var memo = [];

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
            find('/>').then(function() { return []; }),
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
            ).then(function(result) { return function(values) {
                var memo = [],
                    items = result[2] || [];

                for (var i = 0, l = items.length; i < l; i++) {
                    var item = items[i];
                    memo[i] = typeof item === 'function' ? item(values) : item;
                }

                return memo;
            };})
        ))
    ).then(function(result) { return function(values) {
        // TODO: optimize creating arrays: result[4](values, memo), outputMethod.apply(null, memo = [tag, attrs, ...children]);
        return outputMethod(
            typeof result[1] === 'function' ? result[1](values) : result[1],
            result[2](values),
            typeof result[4] === 'function' ? result[4](values) : result[4]
        );
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
    if (method) {
        outputMethod = function(tag, attrs, children) {
            var args = [tag, attrs];

            for (var i = 0, l = children.length; i < l; i++) {
                args[i + 2] = children[i];
            }

            return method.apply(null, args);
        };
    } else {
        outputMethod = defaultOutput;
    }
};

module.exports = jsx;
