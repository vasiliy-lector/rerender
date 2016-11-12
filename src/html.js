import {
    any,
    configure,
    end,
    find,
    next,
    optional,
    repeat,
    required,
    sequence,
    deffered
} from './parser';

configure('cacheEnabled', true);
configure('autoCacheEnabled', true);
configure('autoCacheOptionalEnabled', true);

const
    whiteSpace = find(/^\s+/),
    optionalWhiteSpace = optional(whiteSpace).useCache(),
    textNode = find(/^[^<]+/),
    tagName = find(/^[a-zA-Z][a-zA-Z0-9]*/),
    placeholder = next().then((result, values) => values[result]),
    attrName = find(/^[a-zA-Z_][a-zA-Z0-9]*/),
    booleanAttr = attrName.then(result => [result, true]).useCache(),
    quotedAttr = sequence(
        attrName,
        find('='),
        required(find('"')),
        find(/[^"]*/),
        required(find('"'))
    ).then(result => [result[0], result[3]]).useCache(),
    attrWithPlaceholder = sequence(
        attrName,
        find('='),
        any(
            placeholder,
            sequence(
                required(find('"')),
                placeholder,
                required(find('"'))
            ).then(result => result[1])
        )
    ).then(result => [result[0], result[2]]),
    attrs = repeat(
        any(
            placeholder,
            attrWithPlaceholder,
            quotedAttr,
            booleanAttr
        ),
        whiteSpace
    ).then(results => {
        const memo = {};

        for (let i = 0, l = results.length; i < l; i++) {
            const result = results[i];
            if (result[0]) {
                memo[result[0]] = result[1];
            } else {
                const keys = Object.keys(result);
                let j = keys.length;

                while (j--) {
                    memo[keys[j]] = result[keys[j]];
                }
            }
        }

        return memo;
    }),
    component = sequence(
        find('<').not(find('</')).useCache(),
        required(any(
            tagName,
            placeholder
        )),
        optional(sequence(
            whiteSpace,
            attrs
        ).then(result => result[1])),
        optionalWhiteSpace,
        required(any(
            find('/>').then(() => []).useCache(),
            sequence(
                required(find('>')).useCache(),
                optional(repeat(any(
                    whiteSpace,
                    placeholder,
                    textNode,
                    deffered(() => component)
                ))),
                required(sequence(
                    find('</'),
                    any(
                        tagName,
                        placeholder
                    ),
                    optionalWhiteSpace,
                    find('>')
                )).useCache()
            ).then(result => result[1] || [])
        ))
    ).then(result => ({
        tag: result[1],
        attrs: result[2] || {},
        children: result[4] || []
    })),

    root = sequence(
        optionalWhiteSpace,
        component,
        optionalWhiteSpace,
        end()
    ).then(result => result[1]);

function html(templates, ...values) {
    return root.parse(templates, values);
}

export { html as default };
