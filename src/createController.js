import Component from './Component';
import createTemplate from './createTemplate';

function createController (controller, controllerStatic) {
    return options => Wrapped => {
        const superInit = controller.init;

        class Controller extends Component {}

        Controller.prototype = controller;
        Controller.prototype.init = function() {
            this.options = options;

            if (superInit) {
                superInit.apply(this, arguments);
            }
        };

        // Controller.prototype.postConnect = function() {
        //     const childProps = this.disableMerge ? this.state.connect : {
        //         ...this.props,
        //         ...this.state.connect
        //     };
        //
        //     this.setState({
        //         childProps
        //     });
        // };
        //
        Controller.prototype.render = function() {
            return createTemplate(Wrapped, this.state.childProps || this.props, this.children);
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
