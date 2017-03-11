import execComponent from './execComponent';
import tag from './tag';
import component from './component';
import text from './text';
import childValue from './childValue';
import template from './template';
import { any, end, find, next, optional, repeat, required, test, sequence, defer } from 'nano-parser';

function getValuesFromArguments(args) {
    const l = args.length;
    let values = values = Array(l - 1);

    for (let i = 1; i < l; i++) {
        values[i - 1] = args[i];
    }

    return values;
}

let parser;

function createParser() {
    const
        whiteSpace = find(/^\s+/),
        optionalWhiteSpace = optional(whiteSpace),
        textNode = find(/^[^<]+/),
        tagNameRegexp = /^[a-zA-Z][a-zA-Z0-9]*/,
        tagName = find(tagNameRegexp),
        placeholder = next(),
        attrNameRegexp = /^[a-zA-Z\-][a-zA-Z0-9\-]*/,
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
        ).then(result => (memo, values) => {
            memo.set(result[0], values[result[2]]);
        }),
        attrs = repeat(
            any(
                placeholder.then(index => (memo, values) => {
                    const value = values[index];

                    if (typeof value !== 'object') {
                        return;
                    }

                    const keys = Object.keys(value);
                    let i = keys.length;

                    while (i--) {
                        if (attrNameRegexp.test(keys[i])) {
                            memo.set(keys[i], value[keys[i]]);
                        }
                    }
                }),
                attrWithPlaceholder,
                quotedAttr,
                booleanAttr
            ),
            whiteSpace
        ).then(results => (memo, values) => {
            for (let i = 0, l = results.length; i < l; i++) {
                const result = results[i];
                if (typeof result === 'function') {
                    result(memo, values);
                } else {
                    memo.set(result[0], result[1]);
                }
            }

            return memo;
        }),
        node = sequence(
            find('<').not(find('</')),
            required(any(
                tagName,
                placeholder.then(index => values => {
                    if (typeof values[index] === 'string' && tagNameRegexp.test(values[index])) {
                        return tagNameRegexp.test(values[index]) ? values[index] : 'div';
                    }

                    return values[index];
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
                find('/>').then(() => () => []),
                sequence(
                    required(find('>')),
                    optionalWhiteSpace,
                    optional(any(
                        sequence(
                            repeat(defer(() => node), optionalWhiteSpace),
                            test(find(/^\s*<\//))
                        ).then(result => result[0]).not(find(/^[^<]+/)),
                        repeat(any(
                            placeholder.then(index => (values, position, jsx) => {
                                return jsx.childValue(values[index], position);
                            }),
                            textNode.then(result => (values, position, jsx) => {
                                return jsx.text(result, position);
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
                ).then(result => (values, position, jsx) => {
                    const memo = [],
                        items = result[2] || [];

                    // TODO here that one place were traversing once all childs
                    for (let i = 0, l = items.length; i < l; i++) {
                        const item = items[i];
                        if (typeof item === 'function') {
                            const result = item(values, position.updateId(`${position.id}.${i}`), jsx);
                            if (Array.isArray(result)) {
                                Array.prototype.push.apply(memo, result);
                            } else {
                                memo.push(result);
                            }
                        } else {
                            memo.push(item.exec(position.updateId(`${position.id}.${i}`)));
                        }
                    }

                    return memo;
                })
            ))
        ).then(result => (values, position, jsx) => {
            return jsx.execComponent(result, values, position);
        });

    return sequence(
        optionalWhiteSpace,
        node,
        optionalWhiteSpace,
        end()
    ).useCache();
}

function execCached(result, { jsx, values }) {
    return jsx.template(result[1], values);
}

function createInstanceParser() {
    return (parser || (parser = createParser())).then(execCached);
}

function createInstance(config, warmUp) {
    let instanceParser;

    function jsx(templates) {
        return (instanceParser || (instanceParser = createInstanceParser()))
            .parse(templates, { jsx, values: getValuesFromArguments(arguments)});
    }

    jsx.template = template(config, jsx);
    jsx.execComponent = execComponent(config, jsx);
    jsx.component = component(config, jsx);
    jsx.tag = tag(config, jsx);
    jsx.text = text(config, jsx);
    jsx.childValue = childValue(config, jsx);

    if (warmUp) {
        instanceParser = createInstanceParser();
    }

    return jsx;
}

export { createInstance };
