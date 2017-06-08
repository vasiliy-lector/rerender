import renderServer from '../src/renderServer';
import Component from '../src/Component';
import jsx from '../src/jsx';
import createTemplate from '../src/createTemplate';

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

var renderOptions = {
    hashEnabled: false,
    wrap: false
};

describe('render', () => {
    beforeEach(() => {
        jsx.setOutputMethod(createTemplate);
    });

    describe('renderServer', () => {
        it('should return instance of Promise', () => {
            expect(renderServer(jsx `<div className="block">Text of block</div>`, renderOptions) instanceof Promise).toBe(true);
        });

        it('should render div to div', () => {
            return renderServer(jsx `<div className="block">Text of block</div>`, renderOptions)
                .then(html => {
                    expect(html).toEqual('<div class="block">Text of block</div>');

                    return renderServer(jsx `<div className="block">Text of block</div>`, renderOptions);
                })
                .then(html => expect(html).toEqual('<div class="block">Text of block</div>'));
        });

        it('should render component', () => {
            return renderServer(jsx `<${Block} text="Text of block"><p>Text from parent</p></${Block}>`, renderOptions)
                .then(html => expect(html).toEqual('<div class="block"><p>Text of block</p><p>Text from parent</p></div>'));
        });

        it('should render stateless component', () => {
            return renderServer(jsx `<${Stateless} text="Text of block"><p>Text from parent</p></${Stateless}>`, renderOptions)
                .then(html => expect(html) .toEqual('<div class="block"><p>Text of block</p><p>Text from parent</p></div>'));
        });
    });

});
