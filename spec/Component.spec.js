import { serverRender } from '../src/render';
import Component from '../src/Component';
import jsx from '../src/jsx';

describe('Component', () => {

    it('should work empty component', () => {
        class Block extends Component {}

        expect(serverRender(jsx `<${Block} />`)).toBe('');
    });

    it('should correctly work if render return function', () => {
        class Block extends Component {
            render() {
                return () => {
                    return jsx `<a href="/">link</a>`;
                };
            }
        }

        expect(serverRender(jsx `<${Block} />`, { omitIds: true }))
            .toBe('<a href="/">link</a>');
    });

    it('should correctly work if autoBind property has no function', () => {
        class Block extends Component {
            render() {
                return jsx `<a href="/">link</a>`;
            }
        }

        Block.autoBind = ['noExist'];

        expect(serverRender(jsx `<${Block} />`, { omitIds: true }))
            .toBe('<a href="/">link</a>');
    });
});
