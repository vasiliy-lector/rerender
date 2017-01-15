import { nextTick } from './utils';

class Events {
    constructor() {
        this.callbacks = {};
        this.nextTickTriggers = {};
    }

    onEvent(eventName, callback) {
        let { [eventName]: callbacks = [] } = this.callbacks,
            index = callbacks.indexOf(callback);

        if (index !== -1) {
            return;
        }

        callbacks.push(callback);

        this.callbacks[eventName] = callbacks;
    }

    emit(eventName, payload) {
        let { [eventName]: callbacks = [] } = this.callbacks;

        callbacks.forEach(callback => callback(payload, eventName));
    }

    emitNextTick(eventName, payload) {
        if (!this.nextTickTriggers[eventName]) {
            nextTick(() => {
                delete this.nextTickTriggers[eventName];
                const { [eventName]: callbacks = [] } = this.callbacks;

                callbacks.forEach(callback => callback(payload, eventName));
            });
        }
    }

    on(eventNames, callback) {
        eventNames.split(',').forEach(eventName => this.onEvent(eventName, callback));
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
