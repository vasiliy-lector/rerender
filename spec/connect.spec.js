import { jsdom } from 'jsdom';
import { clientRender } from '../src/render';
import connect from '../src/connect';
import Store from '../src/Store';
import createAction from '../src/createAction';
import Component from '../src/Component';
import html from '../src/html';

describe('connect', () => {
    let actionCallback,
        action,
        store,
        document,
        domNode;

    beforeEach(() => {
        actionCallback = jasmine.createSpy(),
        action = createAction(function() {
            actionCallback();
        }),
        store = new Store({
            state: {
                todos: {
                    list: [1, 2]
                }
            }
        }),
        document = jsdom('<div id="application"></div>').defaultView.window.document,
        domNode = document.getElementById('application');
    });

    it('should bind actions', () => {
        class BlockPure extends Component {
            componentDidMount() {
                this.props.action();
            }
            render() {
                return html `<div className="block">text</div>`;
            }
        }

        const Block = connect({
            actions: {
                action
            }
        })(BlockPure);

        clientRender(
            html `<instance of=${Block} />`,
            domNode,
            { store, document }
        );

        expect(actionCallback).toHaveBeenCalledTimes(1);
    });

    it('should merge props', () => {
        class BlockPure extends Component {
            render() {
                return html `<div>${JSON.stringify(this.props)}</div>`;
            }
        }

        const Block = connect({
            get({
                todos: {
                    list
                }
            }) {
                return {
                    list
                };
            },
            merge({ list, index }) {
                return {
                    todo: list[index]
                };
            }
        })(BlockPure);

        clientRender(
            html `<instance of=${Block} index="1" />`,
            domNode,
            { store, document, omitIds: true }
        );

        expect(domNode.innerHTML)
            .toBe('<div>{"todo":2}</div>');
    });
});
