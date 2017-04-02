import tag from './tag';
import component from './component';
import text from './text';
import childValue from './childValue';
import template from './template';
import { any, end, find, next, optional, repeat, required, test, sequence, defer } from 'nano-parser';
import { shallowEqualArray } from '../utils';
import Attrs from './Attrs';
import Props, { PropsWrapper } from './Props';

function CacheByValues(values, tag, props, id) {
    this.values = values;
    this.tag = tag;
    this.props = props;
    this.id = id;
}

CacheByValues.prototype = {
    type: 'CacheByValues'
};

function execComponent(config, jsx) {
    if (config.stringify) {
        return execComponentStringify(config, jsx);
    } else {
        return execComponentDom(config, jsx);
    }
}

function execComponentStringify(config, jsx) {
    return function(result, values) {
        const tag = typeof result[1] === 'function' ? result[1](values) : result[1];
        const isTag = typeof tag === 'string';
        const props = result[2](isTag ? new Attrs() : new Props(), values);

        if (isTag) {
            return jsx.tag(
                tag,
                props,
                result[4](values, undefined, jsx)
            );
        } else {
            if (typeof tag.defaults === 'object') {
                const defaultsKeys = Object.keys(tag.defaults);

                for (let i = 0, l = defaultsKeys.length; i < l; i++) {
                    if (props.common[defaultsKeys[i]] === undefined) {
                        props.common[defaultsKeys[i]] = tag.defaults[defaultsKeys[i]];
                    }
                }
            }

            return jsx.component(
                tag,
                props,
                jsx.template(result[4], values)
            );
        }
    };
}

function execComponentDom(config, jsx) {
    return function(result, values, position) {
        const { cacheByValues, nextCacheByValues } = config;
        let cached = cacheByValues[position.id];
        let tag, props, isTag, id;

        // immutability of props
        if (cached && shallowEqualArray(cached.values, values)) {
            values = cached.values;
            tag = cached.tag;
            props = cached.props;
            id = cached.id;
            isTag = typeof tag === 'string';
            nextCacheByValues[position.id] = cached;
        } else {
            tag = typeof result[1] === 'function' ? result[1](values) : result[1];
            isTag = typeof tag === 'string';

            if (isTag) {
                props = result[2](new Attrs(), values);
                id = props.special.key ? position.id.replace(/\.\d+$/, `k${props.special.key}`) : position.id;
            } else {
                props = result[2](tag.wrapper ? new PropsWrapper() : new Props(), values);

                if (typeof tag.defaults === 'object') {
                    const defaultsKeys = Object.keys(tag.defaults);

                    for (let i = 0, l = defaultsKeys.length; i < l; i++) {
                        if (props.common[defaultsKeys[i]] === undefined) {
                            props.common[defaultsKeys[i]] = tag.defaults[defaultsKeys[i]];
                        }
                    }
                }

                id = calcComponentPosition(tag, props.special, position.id);
            }

            cached = cacheByValues[id];
            if (id !== position.id) {
                if (cached && shallowEqualArray(cached.values, values)) {
                    values = cached.values;
                    tag = cached.tag;
                    props = cached.props;
                    nextCacheByValues[id] = cached;
                    nextCacheByValues[position.id] = cached;
                } else {
                    cached = new CacheByValues(values, tag, props, id);
                    nextCacheByValues[id] = cached;
                    nextCacheByValues[position.id] = cached;
                }
            } else {
                nextCacheByValues[position.id] = cached;
            }
        }

        if (isTag) {
            return jsx.tag(
                tag,
                props,
                parentNode => result[4](values, position.addPositionLevel(parentNode), jsx),
                id !== position.id ? position.updateId(id) : position
            );
        } else {
            return jsx.component(
                tag,
                props,
                jsx.template(result[4], values),
                id !== position.id ? position.updateId(id) : position
            );
        }
    };
}

function calcComponentPosition(tag, props, position) {
    // TODO warning if many instances of singleton or with same key
    if (tag.uniqid) {
        return `u${tag.uniqid}`;
    } else if (props.uniqid) {
        return `u${props.uniqid}`;
    } else if (props.key) {
        return position.replace(/\.\d+$/, `k${props.key}`);
    } else {
        return `${position}c`;
    }
}
function getValuesFromArguments(args) {
    const l = args.length;
    let values = values = Array(l - 1);

    for (let i = 1; i < l; i++) {
        values[i - 1] = args[i];
    }

    return values;
}

let parser;

function execChildren(config, jsx) {
    if (config.stringify) {
        return execChildrenStringify(config, jsx);
    } else {
        return execChildrenDom(config, jsx);
    }
}

function execChildrenStringify(config, jsx) {
    return function(result, values) {
        const memo = [],
            items = result[2] || [];

        // TODO here that one place were traversing once all childs
        for (let i = 0, l = items.length; i < l; i++) {
            const item = items[i];
            // if (typeof item === 'function') {
            const result = item(values, undefined, jsx);
            if (Array.isArray(result)) {
                Array.prototype.push.apply(memo, result);
            } else {
                memo.push(result);
            }
            // } else {
            //     memo.push(item.exec(undefined, jsx));
            // }
        }

        return memo;
    };
}

function execChildrenDom(config, jsx) {
    return function(result, values, position) {
        const memo = [],
            items = result[2] || [];

        // TODO here that one place were traversing once all childs
        for (let i = 0, l = items.length; i < l; i++) {
            const item = items[i];
            // if (typeof item === 'function') {
            const result = item(values, position.updateId(`${position.id}.${i}`), jsx);
            if (Array.isArray(result)) {
                Array.prototype.push.apply(memo, result);
            } else {
                memo.push(result);
            }
            // } else {
            //     memo.push(item.exec(position.updateId(`${position.id}.${i}`), jsx));
            // }
        }

        return memo;
    };
}

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
            )).then(result => (memo, values) => {
                return result ? result[1](memo, values) : memo;
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
                    return jsx.execChildren(result, values, position);
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
    jsx.execChildren = execChildren(config, jsx);
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
