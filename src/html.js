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

const
    whiteSpace = find(/^\s+/),
    textNode = find(/^[^<]+/),
    tagName = find(/^[a-zA-Z]+/),
    placeholder = next().then((value, args) => args[value]),
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
            find('/>'),
            sequence(
                required(find('>')),
                optional(repeat(any(
                    whiteSpace,
                    placeholder,
                    textNode,
                    deffered(() => component)
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
        attrs: value[3] || {},
        children: value[5] || []
    })),
    root = sequence(
        optional(whiteSpace),
        component,
        optional(whiteSpace),
        end()
    )
        .then(values => values[1]);

function html(templates) {
    return root.parse(templates, Array.prototype.slice.call(arguments, 1)) || undefined;
}

export { html as default };
