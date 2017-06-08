import { jsdom } from 'jsdom';
import renderClient from '../src/render/renderClient';
import connect from '../src/connect';
import Store from '../src/Store';
import createAction from '../src/createAction';
import Component from '../src/Component';

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
            render({ jsx }) {
                return jsx `<div className="block">text</div>`;
            }
        }

        const Block = connect({
            actions: {
                action
            }
        })(BlockPure);

        renderClient(
            ({ jsx }) => jsx `<${Block} />`,
            store,
            domNode,
            { document }
        );

        expect(actionCallback).toHaveBeenCalledTimes(1);
    });

    it('should merge props', () => {
        class BlockPure extends Component {
            render({ jsx }) {
                return jsx `<div>${JSON.stringify(this.props)}</div>`;
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

        renderClient(
            ({ jsx }) => jsx `<${Block} index="1" />`,
            store,
            domNode,
            { document }
        );

        expect(domNode.innerHTML)
            .toBe('<div>{"todo":2}</div>');
    });
});
