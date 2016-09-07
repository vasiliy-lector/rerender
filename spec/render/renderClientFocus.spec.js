import { jsdom } from 'jsdom';
import { clientRender } from '../../src/render';
import Component from '../../src/Component';
import html from '../../src/html';
import connect from '../../src/connect';
import Store from '../../src/Store';

describe('clientRender#focus', () => {
    class Input extends Component {
        render() {
            return html `<input name="block" value="value" />`;
        }
    }

    Input.singleton = true;

    class PagePure extends Component {
        render() {
            const input = html `<instance of=${Input} />`;

            return html `<div className="container">
                <div className="column1">
                    ${this.props.inputInColumn1 ? input : null}
                </div>
                <div className="column2">
                    ${!this.props.inputInColumn1 ? input : null}
                </div>
            </div>`;
        }
    }

    const Page = connect({
            get({
                config: {
                    inputInColumn1
                }
            }) {
                return {
                    inputInColumn1
                };
            }
        })(PagePure),
        store = new Store({
            state: {
                config: {
                    inputInColumn1: true
                }
            }
        }),
        window = jsdom('<div id="application"></div>').defaultView.window,
        document = window.document,
        domNode = document.getElementById('application');

    clientRender(
        html `<instance of=${Page} />`,
        domNode,
        { store, document }
    );

    it('should draw input in column 1', () => {
        expect(document.querySelector('input').parentNode.className).toBe('column1');
    });

    it('should input has focus', () => {
        domNode.querySelector('input').focus();
        expect(document.querySelector('input')).toBe(document.activeElement);
    });

    it('should draw input in column 2', () => {
        jasmine.clock().install();
        jasmine.clock().tick(1);
        store.setState({
            config: {
                inputInColumn1: false
            }
        });
        expect(document.querySelector('input').parentNode.className).toBe('column1');

        jasmine.clock().tick(1);
        expect(document.querySelector('input').parentNode.className).toBe('column2');
    });

    it('should input still has focus', () => {
        expect(document.querySelector('input')).toBe(document.activeElement);
        jasmine.clock().uninstall();
    });
});
