import { jsdom } from 'jsdom';
import Attrs from '../../lib/render/Attrs';
import { Node } from '../../lib/render/tag';
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
});
