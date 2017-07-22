import { jsdom } from 'jsdom';
import jsx from '../src/jsx';
import renderServer from '../src/renderServer';
import renderClient, { RENDER_THROTTLE } from '../src/renderClient';
import Component from '../src/Component';
import connect from '../src/connect';
import { debug } from '../src/debug';

let lifeCycleCalls;
let refCalls;

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

        return jsx `<a onclick=${this.handleClick} target=${target} ref=${this.handleSetRef} href=${href}>link</a>`;
    }
}

StatefullPure.antibind = ['handleClick', 'handleSetRef'];

const Statefull = connect({
    map: ({ links: { target = 'initTarget' } = {} } = {}) => ({ target })
})(StatefullPure);

class PagePure extends Component {
    handleRef() {
        refCalls.push('handleRef');
    }
    render() {
        return this.props.noLink ? null : jsx `<${Statefull} ref=${this.handleRef} />`;
    }
}

PagePure.antibind = ['handleRef'];

const Page = connect({
    map: ({ config: { noLink = false } = {} } = {}) => ({ noLink })
})(PagePure);

const REMOVE_LINK = {
    name: 'REMOVE_LINK',
    reducers: [
        ({ setState }) => setState(true, ['config', 'noLink'])
    ]
};
const SET_NEW_TARGET = {
    name: 'SET_NEW_TARGET',
    reducers: [
        ({ setState }) => setState('newTarget', ['links', 'target'])
    ]
};

beforeEach(() => {
    spyOn(debug, 'log');
    spyOn(debug, 'warn');
    spyOn(debug, 'error');
});

describe('renderServer life cycle', () => {
    it('renderServer should call init, render only', () => {
        const renderOptions = {
            hashEnabled: false,
            wrap: false
        };
        lifeCycleCalls = [];

        return renderServer(jsx `<${Page} />`, renderOptions)
            .then(html => {
                expect(html).toBe('<a target="initTarget" href="initHref">link</a>');
                expect(lifeCycleCalls).toEqual(['init', 'render']);
            });
    });
});

describe('renderClient life cycle', () => {
    const window = jsdom('<div id="application"></div>').defaultView.window;
    const domNode = window.document.getElementById('application');
    let expectedLifeCycle = [];
    let refPage;
    function setRef(page) {
        refPage = page;
    }

    it('renderClient should call init, componentWillMount, componentDidMount', () => {
        lifeCycleCalls = [];
        refCalls = [];
        renderClient(jsx `<${Page} ref=${setRef}/>`, {
            window,
            applicationId: 'application'
        });

        expectedLifeCycle.push('init', 'componentWillMount', 'render', 'handleSetRef', 'componentDidMount');
        expect(refCalls.length).toBe(1);
        expect(domNode.innerHTML).toBe('<a target="initTarget" href="initHref">link</a>');
        expect(lifeCycleCalls).toEqual(expectedLifeCycle);
    });

    it('renderClient should call componentWillReceiveProps', () => {
        jasmine.clock().install();
        refPage.dispatch(SET_NEW_TARGET);

        expect(domNode.querySelector('a').getAttribute('target')).toBe('initTarget');
        expect(lifeCycleCalls).toEqual(expectedLifeCycle);

        jasmine.clock().tick(1);
        expectedLifeCycle.push('componentWillReceiveProps', 'render');
        expect(domNode.innerHTML).toBe('<a target="newTarget" href="initHref">link</a>');
        expect(lifeCycleCalls).toEqual(expectedLifeCycle);
    });

    it('renderClient should work with events', () => {
        expect(domNode.querySelector('a').getAttribute('href')).toBe('initHref');

        domNode.querySelector('a').dispatchEvent(new window.Event('click'));
        expectedLifeCycle.push('handleClick');
        expect(lifeCycleCalls).toEqual(expectedLifeCycle);
        expect(domNode.querySelector('a').getAttribute('href')).toBe('initHref');

        jasmine.clock().tick(RENDER_THROTTLE + 1);

        expectedLifeCycle.push('componentWillReceiveProps', 'render');
        expect(lifeCycleCalls).toEqual(expectedLifeCycle);
        expect(domNode.querySelector('a').getAttribute('href')).toBe('newHref');
    });

    it('renderClient should call componentWillUnmount, componentWillDestroy', () => {
        refPage.dispatch(REMOVE_LINK);

        expect(lifeCycleCalls).toEqual(expectedLifeCycle);
        jasmine.clock().tick(RENDER_THROTTLE + 1);

        expectedLifeCycle.push('componentWillUnmount', 'componentWillDestroy', 'handleSetRef');
        expect(lifeCycleCalls).toEqual(expectedLifeCycle);
        expect(domNode.innerHTML).toBe('');
        jasmine.clock().uninstall();
    });
});