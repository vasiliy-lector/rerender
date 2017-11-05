/* tslint:disable member-access */
import { Component } from './Component';
import { createDecorator } from './createDecorator';
import { createTemplate } from './createTemplate';

import { Controller, ElementType, TemplateChildren } from './types';

type Props = {
    targetComponentType: ElementType,
    targetController: Controller,
    children: TemplateChildren
};
type State = {
    Root: ElementType
};

class Controllers extends Component<Props, State> {
    static wrapper: boolean = true;
    props: Props;
    controllers: Controller[];

    init() {
        this.reWrap();
    }

    componentWillReceiveProps(nextProps: Props) {
        if (nextProps.targetComponentType !== this.props.targetComponentType) {
            this.reWrap(nextProps);
        }
    }

    reWrap(props = this.props) {
        this.controllers = this.getControllers(props);

        this.setState({
            Root: this.getWrapped()
        });
    }

    getWrapped() {
        let current = this.props.targetComponentType;

        for (let i = this.controllers.length - 1; i >= 0; i--) {
            current = createDecorator(this.controllers[i].controller)(
                this.controllers[i].options
            )(current);
        }

        return current;
    }

    getControllers(props: Props) {
        const controllers: Controller[] = [];
        const componentType = this.props.targetComponentType;

        if (props.targetController) {
            if (Array.isArray(props.targetController)) {
                controllers.push.apply(controllers, props.targetController);
            } else {
                controllers.push(props.targetController);
            }
        }

        return controllers;
    }

    render() {
        const { Root } = this.state;

        return createTemplate(Root, this.props, this.props.children);
    }
}

export { Controllers };
