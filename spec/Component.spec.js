import renderServer from '../src/render/renderServer';
import Component from '../src/Component';

describe('Component', () => {

    it('should work empty component', () => {
        class Block extends Component {}

        expect(renderServer(({ jsx }) => jsx `<${Block} />`)).toBe('');
    });

    it('should render not empty component', () => {
        class Block extends Component {
            render({ jsx }) {
                return jsx `<a href="/">link</a>`;
            }
        }

        Block.antibind = ['noExist'];

        expect(renderServer(({ jsx }) => jsx `<${Block} />`))
            .toBe('<a href="/">link</a>');
    });

    it('should correctly work if render return function', () => {
        class Block extends Component {
            render({ jsx }) {
                return () => {
                    return jsx `<a href="/">link</a>`;
                };
            }
        }

        expect(renderServer(({ jsx }) => jsx `<${Block} />`))
            .toBe('<a href="/">link</a>');
    });

    it('should correctly work if antibind property has no function', () => {
        class Block extends Component {
            render({ jsx }) {
                return jsx `<a href="/">link</a>`;
            }
        }

        Block.antibind = ['noExist'];

        expect(renderServer(({ jsx }) => jsx `<${Block} />`))
            .toBe('<a href="/">link</a>');
    });
});
