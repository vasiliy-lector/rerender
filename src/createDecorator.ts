import { createTemplate } from './createTemplate';
import { ComponentType, ElementType } from './types';

type CreateDecoratorSignature =
    (Wrapper: ComponentType<any>) =>
        (options: any) =>
            (Wrapped: ElementType) => ComponentType<any>;

const createDecorator: CreateDecoratorSignature = Wrapper => options => Wrapped => {
    class Decorator extends Wrapper {
        constructor(...args: any[]) {
            super(...args);
            this.setState = this.setState.bind(this); // hoist in prototype chain
            this.options = options;
            this.Wrapped = Wrapped;
        }
    }

    if (!Wrapper.prototype.hasOwnProperty('render')) {
        Decorator.prototype.render = function() {
            return createTemplate(
                this.Wrapped,
                typeof this.renderProps === 'function' ? this.renderProps() : this.props,
                this.props.children
            );
        };
    }

    const wrapperStaticKeys = Object.keys(Wrapper);
    for (let i = 0, l = wrapperStaticKeys.length; i < l; i++) {
        (Decorator as any)[wrapperStaticKeys[i]] = (Wrapper as any)[wrapperStaticKeys[i]];
    }

    Decorator.wrapper = true;

    return Decorator;
};

export { createDecorator };
