import { jsdom } from 'jsdom';
import { serverRender, clientRender } from '../src/render';
import Store from '../src/Store';
import html from '../src/html';
import Component from '../src/Component';
import connect from '../src/connect';
import { getHash } from '../src/utils';

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
                .toEqual('<div class="block" data-rerenderid="0">Text of block</div>');

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

    describe('clientRender', () => {

        global.performance = {
            now: () => {}
        };

        let store;
        const
            json = html `<instance of=${Block} text="Text of block"><p>Text from parent</p></instance>`,
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

    describe('renderClient life cycle', () => {
        const lifeCycleCalls = [];

        class StatefullPure extends Component {
            init() {
                lifeCycleCalls.push('init');
                this.setState({
                    href: 'initHref',
                    target: this.props.target
                });
            }
            componentWillMount() {
                lifeCycleCalls.push('componentWillMount');
            }
            componentDidMount() {
                lifeCycleCalls.push('componentDidMount');
            }
            componentWillUnmount() {
                lifeCycleCalls.push('componentWillUnmount');
            }
            componentWillReceiveProps(nextProps) {
                lifeCycleCalls.push('componentWillReceiveProps');
                this.setState({
                    target: nextProps.target
                });
            }
            componentWillDestroy() {
                lifeCycleCalls.push('componentWillDestroy');
            }
            handleSetRef() {
                // lifeCycleCalls.push('handleSetRef');
            }
            handleClick() {
                this.setState({
                    href: 'newHref'
                });
                lifeCycleCalls.push('handleClick');
            }
            render() {
                lifeCycleCalls.push('render');
                const { href, target } = this.state;

                return html `<a onClick=${this.handleClick} target=${target} ref=${this.handleSetRef} href=${href}>link</a>`;
            }
        }

        StatefullPure.autoBind = ['handleClick', 'handleSetRef'];
        StatefullPure.propToHoist = true;

        const Statefull = connect({
            watch: 'links',
            get({
                links: {
                    target
                }
            }) {
                return { target };
            }
        })(StatefullPure);

        class PagePure extends Component {
            render() {
                return this.props.noLink ? null : html `<instance of=${Statefull} />`;
            }
        }

        const Page = connect({
            watch: 'config',
            get({
                config: {
                    noLink
                }
            }) {
                return {
                    noLink
                };
            }
        })(PagePure);

        const store = new Store({
                state: {
                    links: {
                        target: 'initTarget'
                    },
                    config: {
                        noLink: false
                    }
                }
            }),
            window = jsdom('<div id="application"></div>').defaultView.window,
            document = window.document,
            domNode = document.getElementById('application'),
            expectedLifeCycle = [];

        it('should call init, componentWillMount, componentDidMount', () => {
            clientRender(
                html `<instance of=${Page} />`,
                domNode,
                { store, document }
            );

            expectedLifeCycle.push('init', 'componentWillMount', 'render', 'componentDidMount');
            expect(domNode.innerHTML).toBe('<a target="initTarget" href="initHref" data-rerenderid="0" data-rerenderref="true">link</a>');
            expect(lifeCycleCalls).toEqual(expectedLifeCycle);
        });

        it('should call componentWillReceiveProps', () => {
            jasmine.clock().install();

            store.setState({
                links: {
                    target: 'newTarget'
                }
            });

            expect(domNode.querySelector('a').getAttribute('target')).toBe('initTarget');
            expect(lifeCycleCalls).toEqual(expectedLifeCycle);

            jasmine.clock().tick(1);
            expectedLifeCycle.push('componentWillReceiveProps', 'render');
            expect(domNode.querySelector('a').getAttribute('target')).toBe('newTarget');
            expect(lifeCycleCalls).toEqual(expectedLifeCycle);
        });

        it('should work with events', () => {
            expect(domNode.querySelector('a').getAttribute('href')).toBe('initHref');

            domNode.querySelector('a').dispatchEvent(new window.Event('click'));
            expectedLifeCycle.push('handleClick');
            expect(lifeCycleCalls).toEqual(expectedLifeCycle);
            expect(domNode.querySelector('a').getAttribute('href')).toBe('initHref');

            jasmine.clock().tick(51);

            expectedLifeCycle.push('render');
            expect(lifeCycleCalls).toEqual(expectedLifeCycle);
            expect(domNode.querySelector('a').getAttribute('href')).toBe('newHref');
        });

        it('should call componentWillUnmount, componentWillDestroy', () => {
            store.setState({
                config: {
                    noLink: true
                }
            });

            expect(lifeCycleCalls).toEqual(expectedLifeCycle);
            jasmine.clock().tick(51);

            expectedLifeCycle.push('componentWillUnmount', 'componentWillDestroy');
            expect(lifeCycleCalls).toEqual(expectedLifeCycle);
            jasmine.clock().uninstall();
        });

    });
});
