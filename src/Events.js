class Events {
    emit(eventName, payload) {
        if (!this.callbacks || !this.callbacks[eventName]) {
            return;
        }

        for (let i = 0, l = this.callbacks[eventName].length; i < l; i++) {
            this.callbacks[eventName][i](payload);
        }
    }

    on(eventNames, callback) {
        eventNames.split(' ').forEach(eventName => this.onEvent(eventName, callback));
    }

    onEvent(eventName, callback) {
        if (!this.callbacks) {
            this.callbacks = {};
        }

        if (!this.callbacks[eventName]) {
            this.callbacks[eventName] = [];
        } else if (this.callbacks[eventName].indexOf(callback) !== -1) {
            return;
        }

        this.callbacks[eventName].push(callback);
    }

    un(eventNames, callback) {
        eventNames.split(' ').forEach(eventName => this.onEvent(eventName, callback));
    }

    unEvent(eventName, callback) {
        if (!this.callbacks || !this.callbacks[eventName]) {
            return;
        }

        const index = this.callbacks[eventName].indexOf(callback);

        if (!callback) {
            delete this.callbacks[eventName];
        } else if (index !== -1) {
            this.callbacks[eventName].splice(index, 1);
        }
    }
}

export default Events;
