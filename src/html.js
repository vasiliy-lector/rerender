import {
    any,
    find,
    optional,
    repeat,
    required,
    sequence,
    deffered
} from './parser';

const cache = {},
    parser = (() => {
        const
            whiteSpace = find(/^\s+/),
            textNode = find(/^[^<]+/),
            tagName = find(/^[a-zA-Z]+/),
            placeholder = sequence(
                find('${'),
                required(find(/^\d+/)),
                required(find('}'))
            ).then(value => value[1]),
            attrName = find(/^[a-zA-Z][a-zA-Z0-9]*/),
            booleanAttr = attrName.then(value => `{${value}:true}`),
            quotedAttr = sequence(
                attrName,
                find('='),
                required(find('"')),
                any(placeholder, find(/[^"]*/)),
                required(find('"'))
            ).then(value => `{${value[0]}:'${value[3]}'}`),
            attrWithPlaceholder = sequence(
                attrName,
                find('='),
                placeholder
            ).then(value => `{${value[0]}:args[${value[2]}]}`),
            attrs = repeat(
                any(
                    attrWithPlaceholder,
                    quotedAttr,
                    placeholder.then(value => `args[${value}]`),
                    booleanAttr,
                ),
                whiteSpace
            ).then(value => `Object.assign(${value})`),
            component = sequence(
                find('<').not(find('</')),
                required(any(
                    tagName.then(value => `'${value}'`),
                    placeholder.then(value => `args[${value}]`)
                )),
                optional(sequence(
                    whiteSpace,
                    attrs
                )).then(value => value[1]),
                optional(whiteSpace),
                required(any(
                    find('/>').then(() => '[]'),
                    sequence(
                        required(find('>')),
                        optional(repeat(any(
                            placeholder.then(value => `args[${value}]`),
                            textNode.then(value => `'${value}'`),
                            deffered(() => component),
                            whiteSpace.then(value => `'${value}'`)
                        )),
                        required(find('</')),
                        required(any(
                            tagName,
                            placeholder
                        )),
                        optional(whiteSpace),
                        required(find('>'))
                    )).then(value => `[${value[1].join(',')}]`)
                ))
            ).then(value => `{tag:${value[1]},attrs:${value[2]},children:${value[4]}}`);

        return component.then(value => `return ${value};`);
    })();

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

    if (typeof cache[cacheId] === 'undefined') {
        cache[cacheId] = new Function('args', parser.exec(cacheId, 0).result);
    }

    return cache[cacheId](arguments);
}

export { html as default };
