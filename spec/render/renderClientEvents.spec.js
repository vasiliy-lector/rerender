import { jsdom } from 'jsdom';
import html from '../../src/html';
import Store from '../../src/Store';
import Component from '../../src/Component';
import { clientRender } from '../../src/render';

describe('clientRender#events', () => {
    class Block extends Component {
        handleFirstClick() {}
        handleFirstFocus() {}
        handleFirstBlur() {}
        handleSecondClick() {}
        handleSecondFocus() {}
        handleSecondBlur() {}
        render() {
            return html `<form>
                <input name="first"
                    onClick=${this.handleFirstClick}
                    onFocus=${this.handleFirstFocus}
                    onBlur=${this.handleFirstBlur} />
                <input name="second"
                    onClick=${this.handleSecondClick}
                    onFocus=${this.handleSecondFocus}
                    onBlur=${this.handleSecondBlur} />
            </form>`;
        }
    }

    let window,
        store,
        domNode,
        document;

    beforeEach(() => {
        spyOn(Block.prototype, 'handleFirstFocus');
        spyOn(Block.prototype, 'handleFirstBlur');
        spyOn(Block.prototype, 'handleSecondFocus');
        spyOn(Block.prototype, 'handleSecondClick');

        window = jsdom('<div id="application"></div>').defaultView.window;
        document = window.document;
        domNode = document.getElementById('application');
        store = new Store();

        clientRender(html `<instance of=${Block} />`, domNode, { store, document });
    });

    it('should work properly with focus and blur events', () => {
        domNode.querySelector('input[name="first"]').focus();

        expect(domNode.querySelector('input[name="first"]')).toBe(document.activeElement);
        expect(Block.prototype.handleFirstFocus).toHaveBeenCalledTimes(1);

        domNode.querySelector('input[name="second"]').focus();

        expect(domNode.querySelector('input[name="second"]')).toBe(document.activeElement);
        expect(Block.prototype.handleFirstBlur).toHaveBeenCalledTimes(1);
        expect(Block.prototype.handleSecondFocus).toHaveBeenCalledTimes(1);
    });

    it('should work properly with click event', () => {
        domNode.querySelector('input[name="first"]').focus();

        expect(domNode.querySelector('input[name="first"]')).toBe(document.activeElement);
        expect(Block.prototype.handleFirstFocus).toHaveBeenCalledTimes(1);

        domNode.querySelector('input[name="second"]').dispatchEvent(new window.Event('click'));

        expect(domNode.querySelector('input[name="first"]')).toBe(document.activeElement);
        expect(Block.prototype.handleFirstBlur).not.toHaveBeenCalled();
        expect(Block.prototype.handleSecondFocus).not.toHaveBeenCalled();
        expect(Block.prototype.handleSecondClick).toHaveBeenCalledTimes(1);
    });
});
