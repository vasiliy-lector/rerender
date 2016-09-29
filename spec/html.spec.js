import html from '../src/html';

describe('html', () => {
    it('should convert simple div', () => {
        expect(html `<div className="block"></div>`).toEqual({
            tag: 'div',
            attrs: {
                className: 'block'
            },
            children: []
        });
    });

    it('should convert simple div with prop', () => {
        expect(html `<div className="block" id=${'id1'}></div>`).toEqual({
            tag: 'div',
            attrs: {
                className: 'block',
                id: 'id1'
            },
            children: []
        });
    });

    it('should correctly work with two same templates but another values', () => {
        expect([
            html `<div className="block" id=${'id1'}></div>`,
            html `<div className="block" id=${'id2'}></div>`
        ]).toEqual([
            {
                tag: 'div',
                attrs: {
                    className: 'block',
                    id: 'id1'
                },
                children: []
            },
            {
                tag: 'div',
                attrs: {
                    className: 'block',
                    id: 'id2'
                },
                children: []
            }
        ]);
    });

    it('should convert div with props and children', () => {
        expect(html `<div className="block" id=${'id1'} ${{ dataset: { rerenderid: '0' } }}><p ${{ dataset: { rerenderid: '1' } }}>${'text'}</p></div>`).toEqual({
            tag: 'div',
            attrs: {
                className: 'block',
                id: 'id1',
                dataset: {
                    rerenderid: '0'
                }
            },
            children: [{
                tag: 'p',
                attrs: {
                    dataset: {
                        rerenderid: '1'
                    }
                },
                children: ['text']
            }]
        });
    });
});
