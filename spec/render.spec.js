import { serverRender, clientRender } from '../src/render';
import Store from '../src/Store';
import html from '../src/html';
import Component from '../src/Component';

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
    describe('serverRender', () => {
        it('should render div to div', () => {
            expect(serverRender(html `<div className="block">Text of block</div>`))
                .toEqual('<div class="block" data-rrid="0">Text of block</div>');

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

    // describe('clientRender', () => {
    //     let store,
    //         domNode = {
    //             dataset: {},
    //             removeChild() {},
    //             appendChild() {}
    //         };
    //
    //     beforeEach(() => {
    //         store = new Store();
    //     });
    //
    //     it('should do first render', () => {
    //         let vDom = clientRender(
    //             html `<div className="block">Text of block</div>`,
    //             domNode,
    //             { store }
    //         );
    //         expect(vDom).toBeDefined();
    //     });
    // });
});
