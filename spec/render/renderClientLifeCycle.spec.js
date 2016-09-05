import { jsdom } from 'jsdom';
import { clientRender, RENDER_THROTTLE } from '../../src/render';
import Store from '../../src/Store';
import html from '../../src/html';
import Component from '../../src/Component';
import connect from '../../src/connect';
import { debug } from '../../src/utils';


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
    beforeEach(() => {
        spyOn(debug, 'log');
        spyOn(debug, 'warn');
        spyOn(debug, 'error');
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
                lifeCycleCalls.push('handleSetRef');
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
            handleRef() { }
            render() {
                return this.props.noLink ? null : html `<instance of=${Statefull} ref=${this.handleRef} />`;
            }
        }

        PagePure.autoBind = ['handleRef'];

        const Page = connect({
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
            spyOn(PagePure.prototype, 'handleRef');

            clientRender(
                html `<instance of=${Page} />`,
                domNode,
                { store, document }
            );

            expectedLifeCycle.push('init', 'componentWillMount', 'render', 'handleSetRef', 'componentDidMount');
            expect(PagePure.prototype.handleRef).toHaveBeenCalledTimes(1);
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
            expect(domNode.innerHTML).toBe('<a target="newTarget" href="initHref" data-rerenderid="0" data-rerenderref="true">link</a>');
            expect(lifeCycleCalls).toEqual(expectedLifeCycle);
        });

        it('should work with events', () => {
            expect(domNode.querySelector('a').getAttribute('href')).toBe('initHref');

            domNode.querySelector('a').dispatchEvent(new window.Event('click'));
            expectedLifeCycle.push('handleClick');
            expect(lifeCycleCalls).toEqual(expectedLifeCycle);
            expect(domNode.querySelector('a').getAttribute('href')).toBe('initHref');

            jasmine.clock().tick(RENDER_THROTTLE + 1);

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
            jasmine.clock().tick(RENDER_THROTTLE + 1);

            expectedLifeCycle.push('componentWillUnmount', 'componentWillDestroy');
            expect(lifeCycleCalls).toEqual(expectedLifeCycle);
            jasmine.clock().uninstall();
        });

    });
});
