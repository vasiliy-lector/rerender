import { jsdom } from 'jsdom';
import Attrs from '../../lib/render/Attrs';
import { Node } from '../../lib/render/tag';
import { Text } from '../../lib/render/text';
import Patch, { types } from '../../lib/render/Patch';

describe('Patch', () => {
    describe('new Patch', () => {
        it('should correctly create instance', () => {
            const document = jsdom('<div id="application"></div>').defaultView.window.document;
            const domNode = document.querySelector('#application');
            const patch = new Patch(domNode, document);

            expect(patch.patch).toEqual([]);
            expect(patch.domNode).toBe(domNode);
            expect(patch.document).toBe(document);
            expect(patch.normalize).toBe(undefined);
        });
    });

    describe('method applyCreate', () => {
        it('should create node', () => {
            const document = jsdom('<div id="application"></div>').defaultView.window.document;
            const domNode = document.querySelector('#application');
            const patch = new Patch(domNode, document);
            const parentPosition = '';
            const position = '.childNodes.0';
            const attrs = new Attrs();
            attrs.set('className', 'block');
            patch.applyCreate([
                types.CREATE,
                parentPosition,
                new Node('div', attrs, position)
            ]);
            expect(domNode.innerHTML).toBe('<div class="block"></div>');
        });
    });

    describe('method applyReplace', () => {
        it('should replace node', () => {
            const document = jsdom('<div id="application"><span>Text</span></div>').defaultView.window.document;
            const domNode = document.querySelector('#application');
            const patch = new Patch(domNode, document);
            const position = '.childNodes[0]';
            patch.applyReplace([
                types.REPLACE,
                patch._getRefByPosition(position),
                new Node('div', new Attrs(), position),
                [new Text('Text2', '.childNodes[0].childNodes[0]')]
            ]);
            expect(domNode.innerHTML).toBe('<div>Text2</div>');
        });
    });

    // describe('method applyRemove', () => {
    //     it('should remove node', () => {
    //         const document = jsdom('<div id="application"><p>Text</p></div>').defaultView.window.document;
    //         const domNode = document.querySelector('#application');
    //         const patch = new Patch(domNode, document);
    //         const position = '.childNodes.0';
    //         patch.applyRemove([
    //             types.REMOVE,
    //             patch._getRefByPosition(position)
    //         ]);
    //         expect(domNode.innerHTML).toBe('');
    //     });
    // });
});
