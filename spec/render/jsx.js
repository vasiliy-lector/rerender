import VNode from 'virtual-dom/vnode/vnode';
import VText from 'virtual-dom/vnode/vtext';
import Component from '../../src/Component';
import { createInstance } from '../../src/render/jsx';

class Block extends Component {
    render({ jsx, children }) {
        return jsx `<div className='block'><p>Text of block</p>${children}</div>`;
    }
}

let jsx;
const ROOT = '__r__';

describe('jsx', () => {
    describe('dom', () => {
        beforeEach(() => {
            jsx = createInstance({
                stringify: false,
                instances: {},
                nextInstances: {},
                nextNewInstances: {}
            });
        });


        it('should render component with one child', () => {
            // jsx.template(position => jsx.component(Block, { text: 'Text of block' },
            //     jsx.template(position => [
            //         jsx.tag('p', {}, [jsx.text('Text from parent')], position + '.0')
            //     ])
            //  ))
            //
            // jsx.template(position => jsx.tag('div', { className: 'block' }, [
            //     jsx.tag('p', {}, [jsx.text('Text of block')], position + '.0'),
            //     jsx.childValue(children, position + '.1')
            // ], position))

            expect(jsx `<${Block} text="Text of block">
                <p>Text from parent</p>
            </${Block}>`.exec(ROOT))
                .toEqual(new VNode('div', { className: 'block' }, [
                    new VNode('p', {}, [new VText('Text of block')], ROOT + '.Block.0.0'),
                    new VNode('p', {}, [new VText('Text from parent')], ROOT + '.Block.0.1.0')
                ], ROOT + '.Block.0'));
        });

        it('should render component with multiple childs', () => {
            expect(jsx `<${Block} text="Text of block">
                <p>Text from parent 1</p>
                <p>Text from parent 2</p>
            </${Block}>`.exec(ROOT))
                .toEqual(new VNode('div', { className: 'block' }, [
                    new VNode('p', {}, [new VText('Text of block')], ROOT + '.Block.0.0'),
                    new VNode('p', {}, [new VText('Text from parent 1')], ROOT + '.Block.0.1.0'),
                    new VNode('p', {}, [new VText('Text from parent 2')], ROOT + '.Block.0.1.1')
                ], ROOT + '.Block.0'));
        });
    });

    describe('stringify', () => {
        beforeEach(() => {
            jsx = createInstance({
                stringify: true
            });
        });

        it('should render component with one child', () => {
            expect(jsx `<${Block} text="Text of block">
                <p>Text from parent</p>
            </${Block}>`.exec(ROOT))
                .toBe('<div class="block">' +
                    '<p>Text of block</p>' +
                    '<p>Text from parent</p>' +
                '</div>');
        });

        it('should render component with multiple childs', () => {
            expect(jsx `<${Block} text="Text of block">
                <p>Text from parent 1</p>
                <p>Text from parent 2</p>
            </${Block}>`.exec(ROOT))
                .toEqual('<div class="block">' +
                    '<p>Text of block</p>' +
                    '<p>Text from parent 1</p>' +
                    '<p>Text from parent 2</p>' +
                '</div>');
        });

        it('should escape string values', () => {
            expect(jsx `<div>${'<text&nbsp;>'}</div>`.exec(ROOT))
                .toBe('<div>&lt;text&amp;nbsp;&gt;</div>');

            expect(jsx `<${Block} text="Text of block">${'<text>'}${[
                '<text&nbsp;>',
                jsx `<p>${'<text>'}</p>`,
                [
                    '<text>'
                ]
            ]}</${Block}>`.exec(ROOT))
                .toBe('<div class="block">' +
                    '<p>Text of block</p>' +
                    '&lt;text&gt;' +
                    '&lt;text&amp;nbsp;&gt;<p>&lt;text&gt;</p>&lt;text&gt;' +
                '</div>');
        });
    });
});

