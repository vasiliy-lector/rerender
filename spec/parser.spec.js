import {
    Parser,
    any,
    find,
    optional,
    repeat,
    required,
    sequence
} from '../src/parser';

describe('parser', () => {
    var name = find(/[a-z\-]+/i);
    var quoted = sequence(find('"'), find(/[^"]*/i), find('"')).then(r => r[1]);
    var attr = sequence(name, find('='), quoted).then(r => ({ name: r[0], value: r[2] }));

    var wsp = find(/\s+/);

    var attrs = repeat(attr, wsp).then(r => {
        var m = {};
        r.forEach(a => (m[a.name] = a.value));
        return m;
    });

    var text = find(/[^<]+/i);
    var subnode = new Parser((str, pos) => node.exec(str, pos));

    var node = sequence(
            find('<').not(find('</')),
            required(name),
            optional(sequence(wsp, attrs).then(r => r[1])),
            optional(wsp),
            required(
                any(
                    find('/>').then(() => []),
                    sequence(
                        required(find('>')),
                        optional(repeat(any(
                            text,
                            subnode,
                            wsp
                        ))),
                        required(find('</')),
                        required(name),
                        optional(wsp),
                        required(find('>'))
                    ).then(r => r[1] || [])
                )
            )
        ).then(r => ({ name: r[1], attrs: r[2], nodes: r[4] }));

    it('should parse html', () => {
        const result = node.exec(`<div class="block" id="id1">
            <p id="id2">text of div</p>
            <form onSubmit="">
                <input type="text" value="value" name="firstName" />
                <input type="text" value="value" name="lastName"/>
            </form>
        </div>`, 0);
        expect(result).toBeDefined();
        console.log(JSON.stringify(result, null, 4));
    });
});

