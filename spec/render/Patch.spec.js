import { jsdom } from 'jsdom';
import { Node } from '../../lib/render/tag';
import Patch, { types } from '../../lib/render/Patch';

describe('Patch', () => {
    describe('new Patch', () => {
        it('should correct create instance', () => {
            const document = jsdom('<div id="application"></div>').defaultView.window.document;
            const domNode = document.querySelector('#application');
            const patch = new Patch(domNode, document);

            expect(patch.patch).toEqual([]);
            expect(patch.domNode).toBe(domNode);
            expect(patch.document).toBe(document);
            expect(patch.normalize).toBe(undefined);
        });
    });

    // describe('method applyCreate', () => {
    //     it('should create node', () => {
    //         const document = jsdom('<div id="application"></div>').defaultView.window.document;
    //         const domNode = document.querySelector('#application');
    //         const patch = new Patch(domNode, document);
    //         const position = '.childNodes.0';
    //         patch.applyCreate([
    //             types.CREATE,
    //             position,
    //             new Node('div', { common: [['className', 'block']] }, position)
    //         ]);
    //         expect(domNode.innerHTML).toBe('<div className="block"></div>');
    //     });
    // });
});
