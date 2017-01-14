var Benchmark = require('benchmark'),
    React = require('react'),
    ReactDOMServer = require('react-dom/server'),
    createInstance = require('./lib/jsx').createInstance;

// global.React = React;
// t7.setOutput(t7.Outputs.React);
// es6x.setOutputMethod(React.createElement);

var jsx = createInstance({ stringify: true });

var suite = new Benchmark.Suite;

function rerender() {
    return jsx.template(position =>
        jsx.tag('div', { className: 'block', id: 'id1' }, [
            jsx.tag('form', { action: '../' }, [
                jsx.tag('ul', { className: 'ulclass' }, [
                    jsx.tag('li', { className: 'li1' }, [
                        jsx.tag('input', { type: 'checkbox', value: 'value1', name: 'name1', checked: true }, [], position + '0.0.0.0.0'),
                        jsx.text('Some text 1')
                    ], position + '0.0.0.0'),
                    jsx.tag('li', { className: 'li2' }, [
                        jsx.tag('input', { type: 'checkbox', value: 'value2', name: 'name2', checked: true }, [], position + '0.0.0.1.0'),
                        jsx.text('Some text 2')
                    ], position + '0.0.0.1'),
                    jsx.tag('li', { className: 'li3' }, [
                        jsx.tag('input', { type: 'checkbox', value: 'value3', name: 'name3', checked: true }, [], position + '0.0.0.2.0'),
                        jsx.text('Some text 3')
                    ], position + '0.0.0.2'),
                    jsx.tag('li', { className: 'li4' }, [
                        jsx.tag('input', { type: 'checkbox', value: 'value4', name: 'name4', checked: true }, [], position + '0.0.0.3.0'),
                        jsx.text('Some text 4')
                    ], position + '0.0.0.3')
                ], position + '0.0.0')
            ], position + '.0.0')
        ], position + '.0')
    ).exec('.0');
}
var rerenderTemplate = jsx.template(position =>
    jsx.tag('div', { className: 'block', id: 'id1' }, [
        jsx.tag('form', { action: '../' }, [
            jsx.tag('ul', { className: 'ulclass' }, [
                jsx.tag('li', { className: 'li1' }, [
                    jsx.tag('input', { type: 'checkbox', value: 'value1', name: 'name1', checked: true }, [], position + '0.0.0.0.0'),
                    jsx.text('Some text 1')
                ], position + '0.0.0.0'),
                jsx.tag('li', { className: 'li2' }, [
                    jsx.tag('input', { type: 'checkbox', value: 'value2', name: 'name2', checked: true }, [], position + '0.0.0.1.0'),
                    jsx.text('Some text 2')
                ], position + '0.0.0.1'),
                jsx.tag('li', { className: 'li3' }, [
                    jsx.tag('input', { type: 'checkbox', value: 'value3', name: 'name3', checked: true }, [], position + '0.0.0.2.0'),
                    jsx.text('Some text 3')
                ], position + '0.0.0.2'),
                jsx.tag('li', { className: 'li4' }, [
                    jsx.tag('input', { type: 'checkbox', value: 'value4', name: 'name4', checked: true }, [], position + '0.0.0.3.0'),
                    jsx.text('Some text 4')
                ], position + '0.0.0.3')
            ], position + '0.0.0')
        ], position + '.0.0')
    ], position + '.0')
);

function rerendercachedtemplate() {
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

function pureReact() {
    return ReactDOMServer.renderToString(React.createElement('div', { className: 'block', id: 'id1' },
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
    ));
}

console.log('rerender', rerender()); // eslint-disable-line no-console
console.log('rerenderjsx', rerenderjsx()); // eslint-disable-line no-console
console.log('pureReact', pureReact()); // eslint-disable-line no-console
console.log('rerendercachedtemplate', rerendercachedtemplate()); // eslint-disable-line no-console

suite
.add('rerender', rerender)
.add('rerenderjsx', rerenderjsx)
.add('pureReact jsx', pureReact)
.add('rerendercachedtemplate', rerendercachedtemplate)
.on('cycle', function(event) {
    console.log(String(event.target)); // eslint-disable-line no-console
})
.on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').map('name')); // eslint-disable-line no-console
})
.run({ 'async': true });
