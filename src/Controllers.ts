/* tslint:disable member-access */
import { Component } from './Component';
import { createTemplate } from './createTemplate';

import { Controller, ElementType, TemplateChildren } from './types';

type Props = {
    targetComponentType: ElementType,
    targetController: Controller | Controller[],
};

type State = {
    RootController: ElementType
};

class Controllers extends Component<Props, State> {
    static wrapper = true;

    init() {
        this.reWrap();
    }

    componentWillReceiveProps(nextProps: Props) {
        if (nextProps.targetComponentType !== this.props.targetComponentType) {
            this.reWrap(nextProps);
        }
    }

    reWrap(props = this.props) {
        const { targetController } = this.props;
        const controllers = Array.isArray(targetController) ? targetController : [ targetController ];
        let RootController = this.props.targetComponentType;

        for (let i = controllers.length - 1; i >= 0; i--) {
            RootController = controllers[i](RootController);
        }

        this.setState({
            RootController
        });
    }

    render() {
        return createTemplate(this.state.RootController, this.props, this.props.children);
    }
}

export { Controllers };
