var Benchmark = require('benchmark'),
    React = require('react'),
    t7 = require('t7'),
    getJsx = require('./lib/render').getJsx;
    es6x = require('es6x');

// global.React = React;
// t7.setOutput(t7.Outputs.React);
// es6x.setOutputMethod(React.createElement);

var jsx = getJsx({ stringify: false });

var suite = new Benchmark.Suite;
function es6xFn() {
    return es6x `<div className="block" id="${'id1'}">
        <form action="${'../'}">
            <ul className='ulclass'>
                <li className=${'li1'}>
                    <input type="checkbox"
                        value="${'value1'}"
                        name=${'name1'}
                        checked
                    /> Some text 1
                </li>
                <li className=${'li1'}>
                    <input type="checkbox"
                        value="${'value2'}"
                        name=${'name2'}
                        checked
                    /> Some text 2
                </li>
                <li className=${'li1'}>
                    <input type="checkbox"
                        value="${'value3'}"
                        name=${'name3'}
                        checked
                    /> Some text 3
                </li>
                <li className=${'li1'}>
                    <input type="checkbox"
                        value="${'value4'}"
                        name=${'name4'}
                        checked
                    /> Some text 4
                </li>
            </ul>
        </form>
    </div>`;
}

function t7Fn() {
    return t7 `<div className="block" id="${'id1'}">
        <form action="${'../'}">
            <ul className='ulclass'>
                <li className=${'li1'}>
                    <input type="checkbox"
                        value="${'value1'}"
                        name=${'name1'}
                        checked
                    /> Some text 1
                </li>
                <li className=${'li1'}>
                    <input type="checkbox"
                        value="${'value2'}"
                        name=${'name2'}
                        checked
                    /> Some text 2
                </li>
                <li className=${'li1'}>
                    <input type="checkbox"
                        value="${'value3'}"
                        name=${'name3'}
                        checked
                    /> Some text 3
                </li>
                <li className=${'li1'}>
                    <input type="checkbox"
                        value="${'value4'}"
                        name=${'name4'}
                        checked
                    /> Some text 4
                </li>
            </ul>
        </form>
    </div>`;
}

function rerender() {
    var rerenderTemplate = jsx.createTemplate(position =>
        jsx.renderComponent('div', { className: 'block', id: 'id1' }, position => [
            jsx.renderComponent('form', { action: '../' }, position => [
                jsx.renderComponent('ul', { className: 'li1' }, position => [
                    jsx.renderComponent('input', { type: 'checkbox', value: 'value1', name: 'name1', checked: true }, [], position + '.0'),
                    jsx.renderText('Some text 1')
                ], position + '.0'),
                jsx.renderComponent('ul', { className: 'li2' }, position => [
                    jsx.renderComponent('input', { type: 'checkbox', value: 'value2', name: 'name2', checked: true }, [], position + '.0'),
                    jsx.renderText('Some text 2')
                ], position + '.1'),
                jsx.renderComponent('ul', { className: 'li3' }, position => [
                    jsx.renderComponent('input', { type: 'checkbox', value: 'value3', name: 'name3', checked: true }, [], position + '.0'),
                    jsx.renderText('Some text 3')
                ], position + '.2'),
                jsx.renderComponent('ul', { className: 'li4' }, position => [
                    jsx.renderComponent('input', { type: 'checkbox', value: 'value4', name: 'name4', checked: true }, [], position + '.0'),
                    jsx.renderText('Some text 4')
                ], position + '.3')
            ], position + '.0')
        ], position + '.0')
    );

    return rerenderTemplate.exec('.0');
}

function rerenderjsx() {
    return (jsx `<div className="block" id="${'id1'}">
        <form action="${'../'}">
            <ul className='ulclass'>
                <li className=${'li1'}>
                    <input type="checkbox"
                        value="${'value1'}"
                        name=${'name1'}
                        checked
                    /> Some text 1
                </li>
                <li className=${'li1'}>
                    <input type="checkbox"
                        value="${'value2'}"
                        name=${'name2'}
                        checked
                    /> Some text 2
                </li>
                <li className=${'li1'}>
                    <input type="checkbox"
                        value="${'value3'}"
                        name=${'name3'}
                        checked
                    /> Some text 3
                </li>
                <li className=${'li1'}>
                    <input type="checkbox"
                        value="${'value4'}"
                        name=${'name4'}
                        checked
                    /> Some text 4
                </li>
            </ul>
        </form>
    </div>`).exec('.0');
}

function pure() {
    return {
        tag: 'div',
        attrs: {
            className: 'block',
            id: 'id1'
        },
        children: [{
            tag: 'form',
            attrs: {
                action: '../'
            },
            children: [{
                tag: 'ul',
                attrs: {
                    className: 'ulclass'
                },
                children: [
                    {
                        tag: 'li',
                        attrs: {
                            className: 'li1'
                        },
                        children: [{
                            tag: 'input',
                            attrs: {
                                type: 'checkbox',
                                value: 'value1',
                                name: 'name1',
                                checked: true
                            },
                            children: ['Some text 1']
                        }]
                    },
                    {
                        tag: 'li',
                        attrs: {
                            className: 'li1'
                        },
                        children: [{
                            tag: 'input',
                            attrs: {
                                type: 'checkbox',
                                value: 'value1',
                                name: 'name1',
                                checked: true
                            },
                            children: ['Some text 1']
                        }]
                    },
                    {
                        tag: 'li',
                        attrs: {
                            className: 'li1'
                        },
                        children: [{
                            tag: 'input',
                            attrs: {
                                type: 'checkbox',
                                value: 'value1',
                                name: 'name1',
                                checked: true
                            },
                            children: ['Some text 1']
                        }]
                    },
                    {
                        tag: 'li',
                        attrs: {
                            className: 'li1'
                        },
                        children: [{
                            tag: 'input',
                            attrs: {
                                type: 'checkbox',
                                value: 'value1',
                                name: 'name1',
                                checked: true
                            },
                            children: ['Some text 1']
                        }]
                    }
                ]
            }]
        }]
    };
}

function pureReact() {
    return React.createElement('div', { className: 'block', id: 'id1' },
        React.createElement('form', { action: '../' },
            React.createElement('ul', { className: 'ulclass' },
                React.createElement('li', { className: 'li1' },
                    React.createElement('input', { type: 'checkbox',
                        value: 'value1',
                        name: 'name1',
                        checked: true
                    }), 'Some text 1'
                ),
                React.createElement('li', { className: 'li1' },
                    React.createElement('input', { type: 'checkbox',
                        value: 'value2',
                        name: 'name2',
                        checked: true
                    }), 'Some text 2'
                ),
                React.createElement('li', { className: 'li1' },
                    React.createElement('input', { type: 'checkbox',
                        value: 'value3',
                        name: 'name3',
                        checked: true
                    }), 'Some text 3'
                ),
                React.createElement('li', { className: 'li1' },
                    React.createElement('input', { type: 'checkbox',
                        value: 'value4',
                        name: 'name4',
                        checked: true
                    }), 'Some text 4'
                )
            )
        )
    );
}

console.log('es6xFn', es6xFn()); // eslint-disable-line no-console
console.log('t7Fn', t7Fn()); // eslint-disable-line no-console
console.log('pure', JSON.stringify(pure())); // eslint-disable-line no-console
console.log('rerender', JSON.stringify(rerender())); // eslint-disable-line no-console
console.log('rerenderjsx', JSON.stringify(rerenderjsx())); // eslint-disable-line no-console
console.log('pureReact', pureReact()); // eslint-disable-line no-console

suite
.add('es6x', es6xFn)
.add('t7', t7Fn)
.add('pure', pure)
.add('rerender', rerender)
.add('rerenderjsx', rerenderjsx)
.add('pureReact jsx', pureReact)
.on('cycle', function(event) {
    console.log(String(event.target)); // eslint-disable-line no-console
})
.on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').map('name')); // eslint-disable-line no-console
})
.run({ 'async': true });
