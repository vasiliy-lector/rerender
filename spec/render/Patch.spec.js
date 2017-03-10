import { jsdom } from 'jsdom';
import Attrs from '../../src/render/Attrs';
import Tag from '../../src/virtualDom/Tag';
import Text from '../../src/virtualDom/Text';
import Patch from '../../src/render/Patch';

describe('Patch', () => {
    describe('new Patch', () => {
        it('should correctly create instance', () => {
            const document = jsdom('<div id="application"></div>').defaultView.window.document;
            const domNode = document.querySelector('#application');
            const patch = new Patch(domNode, document);

            expect(patch.commands).toEqual([]);
            expect(patch.domNode).toBe(domNode);
            expect(patch.document).toBe(document);
            expect(patch.normalize).toBe(undefined);
        });
    });

    describe('method _getRefByPosition', () => {
        it('should return link', () => {
            const document = jsdom('<div id="application"><span>Text</span></div>').defaultView.window.document;
            const domNode = document.querySelector('#application');
            const patch = new Patch(domNode, document);
            const position = '.childNodes[0]';
            expect(patch._getRefByPosition(position)).toBe(domNode.childNodes[0]);
            expect(patch._getRefByPosition('')).toBe(domNode);
        });
    });

    describe('methods replace and applyReplace', () => {
        it('should replace node', () => {
            const document = jsdom('<div id="application"><span>Text</span></div>').defaultView.window.document;
            const domNode = document.querySelector('#application');
            const patch = new Patch(domNode, document);
            const position = '.childNodes[0]';
            const nextNode = new Tag('div', new Attrs(), position, 'id1');
            nextNode.childNodes = [new Text('Text2', '.childNodes[0].childNodes[0]', 'id2')];
            patch.replace(position, nextNode);
            patch.apply();
            expect(domNode.innerHTML).toBe('<div>Text2</div>');
        });
    });

    describe('methods create and applyCreate', () => {
        it('should create node', () => {
            const document = jsdom('<div id="application"></div>').defaultView.window.document;
            const domNode = document.querySelector('#application');
            const patch = new Patch(domNode, document);
            const nextNode = new Tag('div', new Attrs(), '.childNodes[0]', 'id1');
            nextNode.childNodes = [new Text('Text', '.childNodes[0].childNodes[0]', 'id2')];
            patch.create('', 0, nextNode);
            patch.create('.childNodes[0]', 0, nextNode.childNodes[0]);
            patch.apply();
            expect(domNode.innerHTML).toBe('<div>Text</div>');
        });
    });
});
