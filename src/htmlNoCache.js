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

configure('cacheEnabled', false);

const
    whiteSpace = find(/^\s+/),
    textNode = find(/^[^<]+/),
    tagName = find(/^[a-zA-Z][a-zA-Z0-9]*/),
    placeholder = next().then((value, args) => args[value]),
    attrName = find(/^[a-zA-Z_][a-zA-Z0-9]*/),
    booleanAttr = attrName.then(value => ({ [value]: true })),
    quotedAttr = sequence(
        attrName,
        find('='),
        required(find('"')),
        find(/[^"]*/),
        required(find('"'))
    ).then(value => ({ [value[0]]: value[3] })),
    attrWithPlaceholder = sequence(
        attrName,
        find('='),
        any(
            placeholder,
            sequence(
                required(find('"')),
                placeholder,
                required(find('"'))
            ).then(values => values[1])
        )
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
        optional(sequence(
            whiteSpace,
            attrs
        ).then(values => values[1])),
        optional(whiteSpace),
        required(any(
            find('/>').then(() => []),
            sequence(
                required(find('>')),
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
                    optional(whiteSpace),
                    find('>')
                ))
            ).then(value => value[1] || [])
        ))
    ).then(value => ({
        tag: value[1],
        attrs: value[2] || {},
        children: value[4]
    })),

    root = sequence(
        optional(whiteSpace),
        component,
        optional(whiteSpace),
        end()
    ).then(value => value[1]);

function html(templates, ...values) {
    return root.parse(templates, values);
}

export { html as default };
