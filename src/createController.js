import Component from './Component';
import createTemplate from './createTemplate';

function createController (controller, controllerStatic) {
    return options => Wrapped => {
        class Controller extends Component {}

        Controller.prototype = {
            ...controller,

            init() {
                this.options = options;

                if (controller.init) {
                    controller.init.apply(this, arguments);
                }
            },

            postConnect(connect) {
                const childProps = controller.disableMerge ? connect : {
                    ...this.props,
                    ...connect
                };

                this.setState({
                    childProps
                });
            },

            render() {
                return createTemplate(Wrapped, this.state.childProps || this.props, this.children);
            }
        };

        if (controllerStatic) {
            for (let name in controllerStatic) {
                Controller[name] = controllerStatic[name];
            }
        }

        Controller.wrapper = true;

        return Controller;
    };
}

export default createController;
