import renderServer from '../../src/render/renderServer';
import Component from '../../src/Component';
import { debug } from '../../src/debug';

class Block extends Component {
    render({ jsx }) {
        return jsx `<div className="${this.props.className}"><p>${this.props.text}</p>${this.children}</div>`;
    }
}

Block.defaults = {
    className: 'block'
};

function Stateless({ props, children, jsx }) {
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

    describe('renderServer', () => {
        it('should render div to div', () => {
            expect(renderServer(({ jsx }) => jsx `<div className="block">Text of block</div>`))
                .toEqual('<div class="block">Text of block</div>');

            expect(renderServer(({ jsx }) => jsx `<div className="block">Text of block</div>`))
                .toEqual('<div class="block">Text of block</div>');
        });

        it('should render component', () => {
            expect(renderServer(({ jsx }) => jsx `<${Block} text="Text of block"><p>Text from parent</p></${Block}>`))
                .toEqual('<div class="block"><p>Text of block</p><p>Text from parent</p></div>');
        });

        it('should render stateless component', () => {
            expect(renderServer(({ jsx }) => jsx `<${Stateless} text="Text of block"><p>Text from parent</p></${Stateless}>`))
                .toEqual('<div class="block"><p>Text of block</p><p>Text from parent</p></div>');
        });
    });

});
