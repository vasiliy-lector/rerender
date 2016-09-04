import { serverRender } from '../../src/render';
import html from '../../src/html';
import Component from '../../src/Component';
import { debug } from '../../src/utils';

class Block extends Component {
    render() {
        return html `<div className="${this.props.className}"><p>${this.props.text}</p>${this.children}</div>`;
    }
}

Block.defaults = {
    className: 'block'
};

function Stateless(props, children) {
    return html `<div className="${props.className}"><p>${props.text}</p>${children}</div>`;
}

Stateless.defaults = {
    className: 'block'
};

describe('render', () => {
    beforeEach(() => {
        spyOn(debug, 'log');
        spyOn(debug, 'warn');
        spyOn(debug, 'error');
    });

    describe('serverRender', () => {
        it('should render div to div', () => {
            expect(serverRender(html `<div className="block">Text of block</div>`))
                .toEqual('<div class="block" data-rerenderid="0">Text of block</div>');

            expect(serverRender(html `<div className="block">Text of block</div>`, { omitIds: true }))
                .toEqual('<div class="block">Text of block</div>');
        });

        it('should render component', () => {
            expect(serverRender(html `<instance of=${Block} text="Text of block"><p>Text from parent</p></instance>`, { omitIds: true }))
                .toEqual('<div class="block"><p>Text of block</p><p>Text from parent</p></div>');
        });

        it('should render stateless component', () => {
            expect(serverRender(html `<instance of=${Stateless} text="Text of block"><p>Text from parent</p></instance>`, { omitIds: true }))
                .toEqual('<div class="block"><p>Text of block</p><p>Text from parent</p></div>');
        });
    });

});
