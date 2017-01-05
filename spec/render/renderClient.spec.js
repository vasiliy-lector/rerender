import { jsdom } from 'jsdom';
import { clientRender } from '../../src/render';
import Store from '../../src/Store';
import jsx from '../../src/jsx';
import Component from '../../src/Component';
import { getHash } from '../../src/utils';
import { debug } from '../../src/debug';

class Block extends Component {
    render() {
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

    describe('clientRender', () => {

        let store;
        const
            json = jsx `<${Block} text="Text of block"><p>Text from parent</p></${Block}>`,
            renderedHtml = '<div class="block"><p>Text of block</p><p>Text from parent</p></div>',
            renderedHtmlWithIds = '<div class="block" data-rerenderid="0"><p data-rerenderid="1">Text of block</p><p data-rerenderid="2">Text from parent</p></div>';

        beforeEach(() => {
            store = new Store();
        });

        it('should do first render with omitIds true', () => {
            const document = jsdom('<div id="application"></div>').defaultView.window.document,
                domNode = document.getElementById('application');

            clientRender(
                json,
                domNode,
                { store, document, omitIds: true }
            );

            expect(domNode.innerHTML).toBe(renderedHtml);
        });

        it('should do first render with omitIds false', () => {
            const document = jsdom('<div id="application"></div>').defaultView.window.document,
                domNode = document.getElementById('application');

            clientRender(
                json,
                domNode,
                { store, document }
            );

            expect(domNode.innerHTML).toBe(renderedHtmlWithIds);
            expect(domNode.firstChild.getAttribute('data-rerenderid')).toBe('0');
        });

        it('should use html if domNode has valid hash', () => {
            const
                hash = getHash(renderedHtmlWithIds),
                document = jsdom(`<div id="application" data-hash="${hash}">${renderedHtmlWithIds}</div>`).defaultView.window.document,
                domNode = document.getElementById('application'),
                { firstChild } = domNode;

            clientRender(
                json,
                domNode,
                { store, document }
            );

            expect(domNode.firstChild).toBe(firstChild);
        });

        it('should not use html if domNode has no valid hash', () => {
            const
                hash = getHash(renderedHtmlWithIds) + '0',
                document = jsdom(`<div id="application" data-hash="${hash}">${renderedHtmlWithIds}</div>`).defaultView.window.document,
                domNode = document.getElementById('application'),
                { firstChild } = domNode;

            clientRender(
                json,
                domNode,
                { store, document }
            );

            expect(domNode.firstChild).not.toBe(firstChild);
        });
    });
});
