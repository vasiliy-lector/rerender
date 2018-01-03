import { Component } from './Component';
import { createTemplate } from './createTemplate';

import { Controller, ElementType, TemplateChildren } from './types';

export type ControllersProps = {
    targetComponentType: ElementType,
    targetController: Controller | Controller[],
};

export type ControllersState = {
    RootController: ElementType
};

class Controllers extends Component<ControllersProps, ControllersState> {
    public static wrapper = true;

    public init() {
        this.reWrap();
    }

    public componentWillReceiveProps(nextProps: ControllersProps) {
        if (nextProps.targetComponentType !== this.props.targetComponentType) {
            this.reWrap(nextProps);
        }
    }

    public render() {
        return createTemplate(this.state.RootController, this.props, this.props.children);
    }

    private reWrap(props = this.props) {
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
}

export { Controllers };
