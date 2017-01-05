import { serverRender } from '../../src/render';
import jsx from '../../src/jsx';
import Component from '../../src/Component';
import { debug } from '../../src/debug';

class Block extends Component {
    render() {
        return jsx `<div className="${this.props.className}"><p>${this.props.text}</p>${this.children}</div>`;
    }
}

Block.defaults = {
    className: 'block'
};

function Stateless(props, children) {
    return jsx `<div className="${props.className}"><p>${props.text}</p>${children}</div>`;
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
            expect(serverRender(jsx `<div className="block">Text of block</div>`))
                .toEqual('<div class="block" data-rerenderid="0">Text of block</div>');

            expect(serverRender(jsx `<div className="block">Text of block</div>`, { omitIds: true }))
                .toEqual('<div class="block">Text of block</div>');
        });

        it('should render component', () => {
            expect(serverRender(jsx `<${Block} text="Text of block"><p>Text from parent</p></${Block}>`, { omitIds: true }))
                .toEqual('<div class="block"><p>Text of block</p><p>Text from parent</p></div>');
        });

        it('should render stateless component', () => {
            expect(serverRender(jsx `<${Stateless} text="Text of block"><p>Text from parent</p></${Stateless}>`, { omitIds: true }))
                .toEqual('<div class="block"><p>Text of block</p><p>Text from parent</p></div>');
        });
    });

});
