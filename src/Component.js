function Component(props, children, { events, id }) {
    this._events = events;
    this._id = id;
    this.state = {};
    this.props = props;
    this.children = children;
}

Component.prototype = {
    type: 'Component',

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
                this._events.emitNextTick('rerender', this._id);
            }
        }
    },

    render() {
        return;
    }
};

export default Component;
