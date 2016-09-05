import { serverRender } from '../src/render';
import Component from '../src/Component';
import html from '../src/html';

describe('Component', () => {

    it('should work empty component', () => {
        class Block extends Component {}

        expect(serverRender(html `<instance of=${Block} />`)).toBe('');
    });

    it('should correctly work if render return function', () => {
        class Block extends Component {
            render() {
                return () => {
                    return html `<a href="/">link</a>`;
                };
            }
        }

        expect(serverRender(html `<instance of=${Block} />`, { omitIds: true }))
            .toBe('<a href="/">link</a>');
    });

    it('should correctly work if autoBind property has no function', () => {
        class Block extends Component {
            render() {
                return html `<a href="/">link</a>`;
            }
        }

        Block.autoBind = ['noExist'];

        expect(serverRender(html `<instance of=${Block} />`, { omitIds: true }))
            .toBe('<a href="/">link</a>');
    });
});
