import createTemplate from './createTemplate';

function createDecorator (Wrapper) {
    return (options, settings) => Wrapped => {
        class Decorator extends Wrapper {
            constructor(...args) {
                super(...args);
                this.setState = this.setState.bind(this); // hoist in prototype chain
                this.setState({
                    options,
                    settings
                });
                this.Wrapped = Wrapped;
                this.getProps && this.setState({
                    props: this.getProps()
                });
            }

            setOptions(options, settings) {
                this.setState({
                    options,
                    settings
                });

                this.getProps && this.setState({
                    props: this.getProps()
                });
            }
        }

        if (!Wrapper.prototype.hasOwnProperty('render')) {
            Decorator.prototype.render = function() {
                const { props = this.props } = this.state;

                return createTemplate(this.Wrapped, props, this.children);
            };
        }

        const wrapperStaticKeys = Object.keys(Wrapper);
        for (let i = 0, l = wrapperStaticKeys.length; i < l; i++) {
            Wrapper[wrapperStaticKeys[i]] = Wrapper[wrapperStaticKeys[i]];
        }

        Decorator.wrapper = true;

        return Decorator;
    };
}

export default createDecorator;
