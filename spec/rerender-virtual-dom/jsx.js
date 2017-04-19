import jsx from '../../src/rerender-virtual-dom/jsx';

function simpleOutput(tag, attrs, ...children) {
    return {
        tag,
        attrs,
        children
    };
}
jsx.setOutputMethod(simpleOutput);

describe('jsx', () => {
    it('should convert simple div', () => {
        expect(jsx `<div className="block"></div>`).toEqual({
            tag: 'div',
            attrs: ['className', 'block'],
            children: []
        });
    });

    it('should convert simple div with prop', () => {
        expect(jsx `<div className="block" id=${'id1'}></div>`).toEqual({
            tag: 'div',
            attrs: ['className', 'block', 'id', 'id1'],
            children: []
        });
    });
});
