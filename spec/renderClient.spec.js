import { jsdom } from 'jsdom';
import renderClient from '../src/renderClient';
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

let window;
let renderOptions;
describe('renderClient', () => {
    beforeEach(() => {
        jsx.setOutputMethod(createTemplate);
        window = jsdom('<div id="application"></div>').defaultView.window;
        renderOptions = {
            window,
            settings: {},
            applicationId: 'application'
        };
    });

    it('should render div to div', () => {
        renderClient(jsx `<div className="block">Text of block</div>`, renderOptions);

        expect(window.document.getElementById('application').innerHTML)
            .toBe('<div class="block">Text of block</div>');
    });

    it('should render component', () => {
        renderClient(jsx `<${Block} text="Text of block"><p>Text from parent</p></${Block}>`, renderOptions);

        expect(window.document.getElementById('application').innerHTML)
            .toBe('<div class="block"><p>Text of block</p><p>Text from parent</p></div>');
    });
});
