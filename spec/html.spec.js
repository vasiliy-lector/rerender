import html from '../src/html';

describe('html', () => {
    it('should transform template to object', () => {
        expect(html `<p className="pp">text</p>`).toEqual({
            tag: 'p',
            attrs: {
                className: 'pp'
            },
            children: 'text'
        });
    });
});
