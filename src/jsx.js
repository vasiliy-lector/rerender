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

    getValuesFromArguments = function getValuesFromArguments(args) {
        for (var i = 1, l = args.length, values = Array(l - 1); i < l; i++) {
            values[i - 1] = args[i];
        }

        return values;
    },

    createInstance = function createInstance() {
        var
            whiteSpace = find(/^\s+/),
            optionalWhiteSpace = optional(whiteSpace),
            textNode = find(/^[^<]+/),
            tagNameRegexp = /^[a-zA-Z][a-zA-Z0-9]*/,
            tagName = find(tagNameRegexp),
            placeholder = next(),
            attrNameRegexp = /^[a-zA-Z_][a-zA-Z0-9]*/,
            attrName = find(attrNameRegexp),
            booleanAttr = attrName.then(function(result) {
                return [result, true];
            }),
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
            ).then(function(result) {
                return [result[0], result[2][1]];
            }),
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
            ).then(function(result) { return function(obj, values) {
                obj[result[0]] = values[result[2]];
            }}),
            attrs = repeat(
                any(
                    placeholder.then(function(index) { return function(obj, values) {
                        var value = values[index];

                        if (typeof value !== 'object') {
                            return;
                        }

                        var keys = Object.keys(value),
                            i = keys.length;

                        while (i--) {
                            if (attrNameRegexp.test(keys[i])) {
                                obj[keys[i]] = value[keys[i]];
                            }
                        }
                    }}),
                    attrWithPlaceholder,
                    quotedAttr,
                    booleanAttr
                ),
                whiteSpace
            ).then(function(results) { return function(values) {
                var memo = {};

                for (var i = 0, l = results.length; i < l; i++) {
                    var result = results[i];
                    if (typeof result === 'function') {
                        result(memo, values);
                    } else {
                        memo[result[0]] = result[1];
                    }
                }

                return memo;
            }}),
            component = sequence(
                find('<').not(find('</')),
                required(any(
                    tagName,
                    placeholder.then(function(index) { return function(values) {
                        return typeof values[index] !== 'string' || tagNameRegexp.test(values[index]) ? values[index] : 'div';
                    }})
                )),
                optional(sequence(
                    whiteSpace,
                    attrs
                )).then(function(result) { return function(values) {
                    return result ? result[1](values) : {};
                }}),
                optionalWhiteSpace,
                required(any(
                    find('/>').then(function() { return [] }),
                    sequence(
                        required(find('>')),
                        optionalWhiteSpace,
                        optional(any(
                            sequence(
                                repeat(defer(function() { return component }), optionalWhiteSpace),
                                test(find(/^\s*<\//))
                            ).then(function(result) {
                                return result[0];
                            }).not(find(/^[^<]+/)),
                            repeat(any(
                                placeholder.then(function (index) { return function(values, position) {
                                    return jsx.renderValue(values[index], position);
                                }}),
                                textNode.then(function(result) { return function(values) {
                                    return jsx.renderText(result);
                                }}),
                                defer(function() { return component })
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
                    ).then(function(result) { return function(values, position) {
                        var memo = [],
                            items = result[2] || [];

                        for (var i = 0, l = items.length; i < l; i++) {
                            var item = items[i];
                            memo[i] = typeof item === 'function'
                                ? item(values, `${position}.${i}`)
                                : item;
                        }

                        return memo;
                    }})
                ))
            ).then(function(result) { return function(values, position) {
                return jsx.renderComponent(
                    typeof result[1] === 'function' ? result[1](values) : result[1],
                    result[2](values),
                    function(position) { return typeof result[4] === 'function' ? result[4](values, position) : result[4] },
                    position
                );
            }}),

            root = sequence(
                optionalWhiteSpace,
                component,
                optionalWhiteSpace,
                end()
            ).useCache().then(function(result, values) {
                return jsx.createTemplate(function (position) {
                    return result[1](values, position);
                });
            });

        function jsx(templates) {
            return root.parse(templates, getValuesFromArguments(arguments));
        };

        return jsx;
    };

export { createInstance };
