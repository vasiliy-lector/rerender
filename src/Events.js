class Events {
    constructor() {
        this.callbacks = {};
    }

    emit(eventName, payload) {
        let { [eventName]: callbacks = [] } = this.callbacks;

        callbacks.forEach(callback => callback(payload, eventName));
    }

    on(eventName = 'default', callback = () => {}) {
        let { [eventName]: callbacks = [] } = this.callbacks,
            index = callbacks.indexOf(callback);

        if (index !== -1) {
            return;
        }

        callbacks.push(callback);

        this.callbacks[eventName] = callbacks;
    }

    un(eventName, callback) {
        let { [eventName]: callbacks = [] } = this.callbacks,
            index = callback && callbacks.indexOf(callback);

        if (!callback) {
            this.callbacks[eventName] = [];
        } else if (index !== -1) {
            callbacks.splice(index, 1);
        }
    }
}

export default Events;
