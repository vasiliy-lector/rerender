import { jsdom } from 'jsdom';
import renderClient from '../../src/render/renderClient';
import Store from '../../src/Store';
import Component from '../../src/Component';
import { getHash } from '../../src/utils';
import { debug } from '../../src/debug';

class Block extends Component {
    render({ jsx }) {
        return jsx `<div className="${this.props.className}"><p>${this.props.text}</p>${this.children}</div>`;
    }
}

Block.defaults = {
    className: 'block'
};

describe('render', () => {
    beforeEach(() => {
        spyOn(debug, 'log');
        spyOn(debug, 'warn');
        spyOn(debug, 'error');
    });

    describe('renderClient', () => {

        let store;
        const rootComponent = ({ jsx }) => jsx `<${Block} text="Text of block"><p>Text from parent</p></${Block}>`;
        const renderedHtml = '<div class="block"><p>Text of block</p><p>Text from parent</p></div>';

        beforeEach(() => {
            store = new Store();
        });

        it('should do first render', () => {
            const document = jsdom('<div id="application"></div>').defaultView.window.document,
                domNode = document.getElementById('application');

            renderClient(
                rootComponent,
                store,
                domNode,
                { document }
            );

            expect(domNode.innerHTML).toBe(renderedHtml);
        });

        it('should use server side render result', () => {
            const document = jsdom(`<div id="application">${renderedHtml}</div>`).defaultView.window.document;
            const domNode = document.getElementById('application');
            const firstChild = domNode.childNodes[0];

            renderClient(
                rootComponent,
                store,
                domNode,
                { document }
            );

            expect(domNode.childNodes[0]).toBe(firstChild);
        });

        it('should not use server side render result', () => {
            const document = jsdom('<div id="application"><span>text</span></div>').defaultView.window.document;
            const domNode = document.getElementById('application');
            const firstChild = domNode.childNodes[0];

            renderClient(
                rootComponent,
                store,
                domNode,
                { document }
            );

            expect(domNode.childNodes[0]).not.toBe(firstChild);
        });
    });
});
