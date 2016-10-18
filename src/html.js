import {
    any,
    find,
    optional,
    repeat,
    required,
    sequence,
    deffered
} from './parser';

let getArgs;

const
    // cache = {},
    whiteSpace = find(/^\s+/),
    textNode = find(/^[^<]+/),
    tagName = find(/^[a-zA-Z]+/),
    placeholder = sequence(
        find('${'),
        required(find(/^\d+/)),
        required(find('}'))
    ).then(value => getArgs()[value[1]]),
    attrName = find(/^[a-zA-Z_][a-zA-Z0-9]*/),
    booleanAttr = attrName.then(value => ({ [value]: true })),
    quotedAttr = sequence(
        attrName,
        find('='),
        required(find('"')),
        any(
            placeholder,
            find(/[^"]*/)
        ),
        required(find('"'))
    ).then(value => ({ [value[0]]: value[3] })),
    attrWithPlaceholder = sequence(
        attrName,
        find('='),
        placeholder
    ).then(value => ({ [value[0]]: value[2] })),
    attrs = repeat(
        any(
            placeholder,
            attrWithPlaceholder,
            quotedAttr,
            booleanAttr
        ),
        whiteSpace
    ).then(values => Object.assign.call(Object, {}, ...values)),
    component = sequence(
        find('<').not(find('</')),
        required(any(
            tagName,
            placeholder
        )),
        optional(whiteSpace),
        attrs,
        optional(whiteSpace),
        required(any(
            find('/>').then(() => []),
            sequence(
                required(find('>')),
                optional(repeat(any(
                    whiteSpace,
                    placeholder,
                    textNode,
                    deffered(() => component),
                ))),
                required(find('</')),
                required(any(
                    tagName,
                    placeholder
                )),
                optional(whiteSpace),
                required(find('>'))
            ).then(value => value[1])
        ))
    ).then(value => ({
        tag: value[1],
        attrs: value[3],
        children: value[5]
    }));

function getCacheId(templates) {
    let id = '';
    const l = templates.length - 1;

    for (let i = 0; i < l; i++) {
        id += templates[i] + '${' + (i + 1) + '}';
    }

    return (id + templates[l]).trim();
}

function html(templates) {
    const cacheId = getCacheId(templates);

    // if (typeof cache[cacheId] === 'undefined') {
    //     const fn = component.exec(cacheId, 0).result;
    //     try {
    //         cache[cacheId] = new Function('args', fn);
    //     } catch (error) {
    //         throw new Error(`Error creating cache function for template: ${cacheId}\nfunciton body: ${fn}\n${error}`);
    //     }
    // }
    //
    // return cache[cacheId](arguments);
    const args = arguments;

    getArgs = () => args;

    return component.exec(cacheId, 0).result;
}

export { html as default };
