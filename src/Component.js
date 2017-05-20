class Component {
    constructor(props, children, { events, id, dispatch }) {
        this._events = events;
        this._id = id;
        this.dispatch = dispatch;
        this.state = {};
        this.props = props;
        this.children = children;
    }

    setState(changes) {
        const nextState = {};
        let changed;

        for (let name in this.state) {
            nextState[name] = this.state[name];
        }

        for (let name in changes) {
            if (changes[name] !== this.state[name]) {
                changed = true;
                nextState[name] = changes[name];
            }
        }

        if (changed) {
            this.state = nextState;

            if (this._componentMounted && !this._settingProps) {
                this._events.emit('rerender-one', this._id);
            }
        }
    }

    render() {
        return;
    }
}

export default Component;
