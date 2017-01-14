import { tag, component, text, childValue, template } from './bricks';
import { any, end, find, next, optional, repeat, required, test, sequence, defer } from 'nano-parser';

const getValuesFromArguments = function getValuesFromArguments(args) {
        const l = args.length;
        let values = values = Array(l - 1);

        for (let i = 1; i < l; i++) {
            values[i - 1] = args[i];
        }

        return values;
    },

    createInstance = function createInstance(config) {
        const
            whiteSpace = find(/^\s+/),
            optionalWhiteSpace = optional(whiteSpace),
            textNode = find(/^[^<]+/),
            tagNameRegexp = /^[a-zA-Z][a-zA-Z0-9]*/,
            tagName = find(tagNameRegexp),
            placeholder = next(),
            attrNameRegexp = /^[a-zA-Z_][a-zA-Z0-9]*/,
            attrName = find(attrNameRegexp),
            booleanAttr = attrName.then(result => [result, true]),
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
            ).then(result => [result[0], result[2][1]]),
            attrWithPlaceholder = sequence(
                attrName,
                find('='),
                any(
                    placeholder,
                    sequence(
                        find('\''),
                        placeholder,
                        required(find('\''))
                    ).then(result => result[1]),
                    sequence(
                        find('"'),
                        placeholder,
                        required(find('"'))
                    ).then(result => result[1])
                )
            ).then(result => (obj, values) => {
                obj[result[0]] = values[result[2]];
            }),
            attrs = repeat(
                any(
                    placeholder.then(index => (obj, values) => {
                        const value = values[index];

                        if (typeof value !== 'object') {
                            return;
                        }

                        const keys = Object.keys(value);
                        let i = keys.length;

                        while (i--) {
                            if (attrNameRegexp.test(keys[i])) {
                                obj[keys[i]] = value[keys[i]];
                            }
                        }
                    }),
                    attrWithPlaceholder,
                    quotedAttr,
                    booleanAttr
                ),
                whiteSpace
            ).then(results => values => {
                const memo = {};

                for (let i = 0, l = results.length; i < l; i++) {
                    const result = results[i];
                    if (typeof result === 'function') {
                        result(memo, values);
                    } else {
                        memo[result[0]] = result[1];
                    }
                }

                return memo;
            }),
            node = sequence(
                find('<').not(find('</')),
                required(any(
                    tagName,
                    placeholder.then(index => values => {
                        return typeof values[index] !== 'string' || tagNameRegexp.test(values[index]) ? values[index] : 'div';
                    })
                )),
                optional(sequence(
                    whiteSpace,
                    attrs
                )).then(result => values => {
                    return result ? result[1](values) : {};
                }),
                optionalWhiteSpace,
                required(any(
                    find('/>').then(() => []),
                    sequence(
                        required(find('>')),
                        optionalWhiteSpace,
                        optional(any(
                            sequence(
                                repeat(defer(() => node), optionalWhiteSpace),
                                test(find(/^\s*<\//))
                            ).then(result => result[0]).not(find(/^[^<]+/)),
                            repeat(any(
                                placeholder.then(index => (values, position) => {
                                    return jsx.childValue(values[index], position);
                                }),
                                textNode.then(result => () => {
                                    return jsx.text(result);
                                }),
                                defer(() => node)
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
                    ).then(result => (values, position) => {
                        const memo = [],
                            items = result[2] || [];

                        for (let i = 0, l = items.length; i < l; i++) {
                            const item = items[i];
                            memo[i] = typeof item === 'function'
                                ? item(values, `${position}.${i}`)
                                : item;
                        }

                        return memo;
                    })
                ))
            ).then(result => (values, position) => {
                const tag = typeof result[1] === 'function' ? result[1](values) : result[1];

                return (typeof tag === 'string' ? jsx.tag : jsx.component)(
                    tag,
                    result[2](values),
                    typeof result[4] === 'function' ? position => result[4](values, position) : result[4],
                    position
                );
            }),

            rootNode = sequence(
                optionalWhiteSpace,
                node,
                optionalWhiteSpace,
                end()
            ).useCache().then((result, values) => {
                return jsx.template(position => result[1](values, position));
            });

        function jsx(templates) {
            return rootNode.parse(templates, getValuesFromArguments(arguments));
        }

        jsx.template = template;
        jsx.component = component(config, jsx);
        jsx.tag = tag(config, jsx);
        jsx.text = text(config);
        jsx.childValue = childValue(config, jsx);

        return jsx;
    };

export { createInstance };
