import { hoistStatics } from './utils';

function createDecorator () {
    return Wrapper => options => Wrapped => {
        class Controller extends Wrapper {
            init() {
                this.options = options;
                this.Wrapped = Wrapped;
            }
        }

        return hoistStatics(Controller, Wrapped);
    };
}

export default createDecorator;
