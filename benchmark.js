var Benchmark = require('benchmark'),
    parser = require('./lib/parser.js');

var suite = new Benchmark.Suite,
    { find, next, sequence, repeat, required, any, optional, deffered, end } = parser,
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
    attrsWithCache = repeat(
        any(
            placeholder,
            attrWithPlaceholder,
            quotedAttr.useCache(),
            booleanAttr.useCache()
        ),
        whiteSpace
    ).then(values => Object.assign.call(Object, {}, ...values)),
    componentNoCache = sequence(
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
                    deffered(() => componentNoCache)
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
    })),
    componentWithCache = sequence(
        find('<').not(find('</')).useCache(),
        required(any(
            tagName,
            placeholder
        )),
        optional(whiteSpace),
        attrsWithCache,
        optional(whiteSpace),
        required(any(
            find('/>').then(() => []),
            sequence(
                required(find('>')).useCache(),
                optional(repeat(any(
                    whiteSpace,
                    placeholder,
                    textNode,
                    deffered(() => componentWithCache)
                ))),
                sequence(
                    required(find('</')),
                    required(any(
                        tagName,
                        placeholder
                    )),
                    optional(whiteSpace),
                    required(find('>'))
                ).useCache()
            ).then(value => value[1])
        ))
    ).then(value => ({
        tag: value[1],
        attrs: value[3],
        children: value[5]
    })),

    noCacheRoot = sequence(
        optional(whiteSpace),
        componentNoCache,
        optional(whiteSpace),
        end()
    ).then(value => value[1]),
    rootWithCache = sequence(
        optional(whiteSpace),
        componentWithCache,
        optional(whiteSpace),
        end()
    ).then(value => value[1]).useCache(),
    templates = ['<div class="block" style=',' id="id1" title=','><p id="id2" class=','>text of p</p></div>'],
    values = [{ background: 'red' }, 'title', 'classname'];

console.log('noCacheRoot', noCacheRoot.parse(templates, values)); // eslint-disable-line no-console
console.log('rootWithCache', rootWithCache.parse(templates, values)); // eslint-disable-line no-console

suite
.add('noCacheRoot', () => noCacheRoot.parse(templates, values))
.add('rootWithCache', () => rootWithCache.parse(templates, values))
.on('cycle', function(event) {
    console.log(String(event.target)); // eslint-disable-line no-console
})
.on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').map('name')); // eslint-disable-line no-console
})
.run({ 'async': true });
