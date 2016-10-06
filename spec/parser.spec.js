import {
    Parser,
    any,
    find,
    optional,
    repeat,
    required,
    sequence,
    deffered
} from '../src/parser';

describe('Parser', () => {
    describe('method find', () => {
        it('should work with strings', () => {
            const pattern = find('a');
            expect(pattern.exec('abc', 0)).toEqual({
                result: 'a',
                end: 1
            });
            expect(typeof pattern.exec('abc', 1)).toBe('undefined');
            expect(pattern.exec('bac', 1)).toEqual({
                result: 'a',
                end: 2
            });
            expect(typeof pattern.exec('bac', 0)).toBe('undefined');
        });

        it('should work with regexps', () => {
            const pattern = find(/a/),
                patternNotB = pattern.not(find('b'));

            expect(pattern.exec('abc', 0)).toEqual({
                result: 'a',
                end: 1
            });
            expect(typeof pattern.exec('abc', 1)).toBe('undefined');
            expect(pattern.exec('bac', 1)).toEqual({
                result: 'a',
                end: 2
            });
            expect(typeof pattern.exec('bac', 0)).toBe('undefined');
        });

        it('should work not', () => {
            const pattern = find(/[a-z]/).not(find('a'));

            expect(typeof pattern.exec('abc', 0)).toBe('undefined');
            expect(pattern.not(find('a')).exec('abc', 1)).toEqual({
                result: 'b',
                end: 2
            });
        })
    });

    describe('method any', () => {
        it('should find pattern', () => {
            const pattern = any(
                find('a'),
                find('b')
            );
            expect(pattern.exec('abc', 0)).toEqual({
                result: 'a',
                end: 1
            });
            expect(pattern.exec('bac', 0)).toEqual({
                result: 'b',
                end: 1
            });
            expect(pattern.exec('bac', 1)).toEqual({
                result: 'a',
                end: 2
            });
            expect(typeof pattern.exec('abc', 2)).toBe('undefined');
            expect(typeof pattern.exec('cde', 0)).toBe('undefined');
        });
    });

    describe('method sequence', () => {
        it('should find pattern', () => {
            const pattern = sequence(
                find('a'),
                find('b')
            );
            expect(pattern.exec('abc', 0)).toEqual({
                result: ['a', 'b'],
                end: 2
            });
            expect(typeof pattern.exec('bac', 0)).toBe('undefined');
            expect(pattern.exec('dabc', 1)).toEqual({
                result: ['a', 'b'],
                end: 3
            });
            expect(typeof pattern.exec('dabc', 0)).toBe('undefined');
            expect(typeof pattern.exec('bacd', 0)).toBe('undefined');
        });

        it('should work then', () => {
            const pattern = sequence(
                find('a'),
                find('b')
            ).then(value => value[0] + value[1]);
            expect(pattern.exec('abc', 0)).toEqual({
                result: 'ab',
                end: 2
            });
        });
    });

    describe('method repeat', () => {
        it('should find pattern', () => {
            const pattern = repeat(
                find(/[a-z]+/i),
                find(/\s/)
            );
            expect(pattern.exec('a bc def ghjk', 0)).toEqual({
                result: ['a', 'bc', 'def', 'ghjk'],
                end: 13
            });
            expect(pattern.exec('a bc ', 0)).toEqual({
                result: ['a', 'bc'],
                end: 4
            });
        });
        it('should work without delimeter', () => {
            const pattern = repeat(
                find(/\d/)
            );
            expect(pattern.exec('123', 0)).toEqual({
                result: ['1', '2', '3'],
                end: 3
            });
        });
    });

    describe('integration methods', () => {
        const
            name = find(/[a-z\-]+/i),
            attr = sequence(
                name,
                find('='),
                sequence(
                    find('"'),
                    find(/[^"]*/i),
                    find('"')
                ).then(value => value[1])
            ).then(value => ({ name: value[0], value: value[2] })),
            whiteSpace = find(/\s+/),
            attrs = repeat(attr, whiteSpace).then(value => {
                var result = {};
                value.forEach(a => (result[a.name] = a.value));
                return result;
            }),
            text = find(/[^<]+/i),
            node = sequence(
                find('<').not(find('</')),
                required(name),
                optional(sequence(whiteSpace, attrs).then(value => value[1])),
                optional(whiteSpace),
                required(
                    any(
                        find('/>').then(() => []),
                        sequence(
                            required(find('>')),
                            optional(repeat(any(
                                text,
                                deffered(() => node),
                                whiteSpace
                            ))),
                            required(find('</')),
                            required(name),
                            optional(whiteSpace),
                            required(find('>'))
                        ).then(value => value[1] || [])
                    )
                )
            ).then(value => ({
                tag: value[1],
                attrs: value[2],
                children: value[4]
            }));

        it('should parse one element', () => {
            const result = node.exec(`<div class="block" id="id1">text of div</div>`, 0);
            expect(result.result).toEqual({
                tag: 'div',
                attrs: {
                    class: 'block',
                    id: 'id1'
                },
                children: ['text of div']
            });
        });

        it('should parse element with child', () => {
            const result = node.exec(`<div class="block" id="id1"><p id="id2">text of p</p></div>`, 0);
            expect(result.result).toEqual({
                tag: 'div',
                attrs: {
                    class: 'block',
                    id: 'id1'
                },
                children: [{
                    tag: 'p',
                    attrs: {
                        id: 'id2'
                    },
                    children: ['text of p']
                }]
            });
        });

        it('should parse self closed element', () => {
            const result = node.exec(`<input type="text" value="value" name="firstName" />`, 0);
            expect(result.result).toEqual({
                tag: 'input',
                attrs: {
                    type: 'text',
                    value: 'value',
                    name: 'firstName'
                },
                children: []
            });
        });

        it('should parse self closed element without white space before slash', () => {
            const result = node.exec(`<input type="text" value="value" name="firstName"/>`, 0);
            expect(result.result).toEqual({
                tag: 'input',
                attrs: {
                    type: 'text',
                    value: 'value',
                    name: 'firstName'
                },
                children: []
            });
        });
    });
});
