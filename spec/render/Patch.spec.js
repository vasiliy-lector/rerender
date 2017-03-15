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

    describe('method getRefByPosition', () => {
        it('should return link', () => {
            const document = jsdom('<div id="application"><span>Text</span></div>').defaultView.window.document;
            const domNode = document.querySelector('#application');
            const patch = new Patch(domNode, document);
            const position = '.childNodes[0]';
            expect(patch.getRefByPosition(position)).toBe(domNode.childNodes[0]);
            expect(patch.getRefByPosition('')).toBe(domNode);
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

    describe('methods move and applyMove', () => {
        it('should move node', () => {
            const node = new Tag('div', new Attrs(), '.childNodes[0].childNodes[0]', 'id1');
            node.childNodes = [new Tag(
                'span',
                new Attrs(),
                '.childNodes[0].childNodes[0].childNodes[0]',
                'id2'
            )];
            node.childNodes[0].childNodes = [new Text(
                'Text',
                '.childNodes[0].childNodes[0].childNodes[0].childNodes[0]',
                'id3'
            )];
            const initHtml = '<div id="application"><div><span>Text</span></div><div></div></div>';
            const document = jsdom(initHtml).defaultView.window.document;
            const domNode = document.querySelector('#application');
            const patch = new Patch(domNode, document);
            patch.move('.childNodes[0].childNodes[0]', '.childNodes[1]', 0, node);
            patch.apply();
            expect(domNode.innerHTML).toBe('<div></div><div><span>Text</span></div>');
        });
    });

    describe('methods update and applyUpdate', () => {
        it('should update attributes of node', () => {
            const document = jsdom('<div id="application"><span>Text</span></div>').defaultView.window.document;
            const domNode = document.querySelector('#application');
            const patch = new Patch(domNode, document);
            const nextAttrs = new Attrs();
            nextAttrs.set('className', 'block');
            nextAttrs.set('id', 'id1');
            patch.update('.childNodes[0]', {
                common: [nextAttrs.common, null],
                events: null
            });
            patch.apply();
            expect(domNode.innerHTML).toBe('<span class="block" id="id1">Text</span>');
        });
    });

    describe('methods attachEvents and applyAttachEvents', () => {
        it('should attach eventHandler to node', () => {
            const window = jsdom('<div id="application"><span>Text</span></div>').defaultView.window;
            const document = window.document;
            const domNode = document.querySelector('#application');
            const patch = new Patch(domNode, document);
            const nextAttrs = new Attrs();
            const handleClick = jasmine.createSpy();
            nextAttrs.set('onclick', handleClick);
            patch.attachEvents('.childNodes[0]', nextAttrs.events);
            patch.applyAttachEvents();
            expect(domNode.innerHTML).toBe('<span>Text</span>');
            domNode.childNodes[0].dispatchEvent(new window.Event('click'));
            expect(handleClick).toHaveBeenCalledTimes(1);
        });
    });

    describe('methods setRef and applySetRefs', () => {
        it('should call callback for ref and send ref to node', () => {
            const document = jsdom('<div id="application"><span>Text</span></div>').defaultView.window.document;
            const domNode = document.querySelector('#application');
            const patch = new Patch(domNode, document);
            const handleRef = jasmine.createSpy();
            patch.setRef('.childNodes[0]', handleRef);
            patch.applySetRefs();
            expect(handleRef).toHaveBeenCalledTimes(1);
        });
    });

    describe('methods splitText and applySplitTexts', () => {
        it('should split text node into 2 nodes', () => {
            const document = jsdom('<div id="application"><span>Text;Abc</span></div>').defaultView.window.document;
            const domNode = document.querySelector('#application');
            const patch = new Patch(domNode, document);
            patch.splitText('.childNodes[0].childNodes[0]', 5);
            expect(domNode.childNodes[0].childNodes[0].data).toBe('Text;Abc');
            patch.applySplitTexts();
            expect(domNode.childNodes[0].childNodes[0].data).toBe('Text;');
            expect(domNode.childNodes[0].childNodes[1].data).toBe('Abc');
        });
    });
});
