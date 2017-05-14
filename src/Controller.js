import Component from './Component';
import createTemplate from './createTemplate';

class Controller extends Component {
    constructor(props, children, { events, id, dispatch }) {
        super(props, children, { events, id });
        this.dispatch = dispatch;

        if (this.getProps) {
            this.setState({
                props: this.getProps()
            });
        }
    }

    render() {
        return createTemplate(this.Wrapped, this.state.childrenProps, this.children);
    }
}

export default Controller;
