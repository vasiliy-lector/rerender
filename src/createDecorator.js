import Component from './Component';
import createTemplate from './createTemplate';
import { shallowEqual } from './utils';

function createDecorator (pseudoConstructor, controllerPrototype, controllerStatic) {
    return options => Wrapped => {
        class Controller extends Component {
            constructor(...args) {
                super(...args);

                this.options = options;
                this.Wrapped = Wrapped;

                if (pseudoConstructor) {
                    pseudoConstructor.apply(this, args);
                }
            }
        }

        if (controllerPrototype) {
            Controller.prototype = controllerPrototype;
        }

        Controller.prototype.setChildProps = function(nextChildProps) {
            if (!shallowEqual(nextChildProps, this.state.childProps)) {
                this.setState({
                    childProps: nextChildProps
                });
            }
        };

        Controller.prototype.render = function() {
            return createTemplate(this.Wrapped, this.state.childProps || this.props, this.children);
        };

        if (controllerStatic) {
            for (let name in controllerStatic) {
                Controller[name] = controllerStatic[name];
            }
        }

        Controller.controller = true;

        return Controller;
    };
}

export default createDecorator;
