import { Events } from '../src/Events';

let events: Events;

describe('Events', () => {
    beforeEach(() => {
        events = new Events();
    });

    it('should work subscription with method on', () => {
        const mock = jasmine.createSpyObj('mock', ['event1Handler', 'event1HandlerAnother', 'event2Handler']);
        const payload1 = {
            something: true
        };
        const payload2 = 'payload2';

        events.on('event1', mock.event1Handler);
        events.on('event1', mock.event1HandlerAnother);
        events.on('event2', mock.event2Handler);

        events.emit('event1', payload1);
        expect(mock.event1Handler).toHaveBeenCalledTimes(1);
        expect(mock.event1Handler).toHaveBeenCalledWith(payload1);
        expect(mock.event1HandlerAnother).toHaveBeenCalledTimes(1);
        expect(mock.event1HandlerAnother).toHaveBeenCalledWith(payload1);

        events.emit('event1', payload2);
        expect(mock.event1Handler).toHaveBeenCalledTimes(2);
        expect(mock.event1Handler).toHaveBeenCalledWith(payload2);
        expect(mock.event1HandlerAnother).toHaveBeenCalledTimes(2);
        expect(mock.event1HandlerAnother).toHaveBeenCalledWith(payload2);

        events.emit('event2', false);
        expect(mock.event1Handler).toHaveBeenCalledTimes(2);
        expect(mock.event1HandlerAnother).toHaveBeenCalledTimes(2);
        expect(mock.event2Handler).toHaveBeenCalledTimes(1);
        expect(mock.event2Handler).toHaveBeenCalledWith(false);
    });

    it('should correctly work with unknown event', () => {
        const mock = jasmine.createSpyObj('mock', ['eventHandler']);

        events.on('event', mock.eventHandler);
        events.emit('unknown', true);

        expect(mock.eventHandler).toHaveBeenCalledTimes(0);
    });

    it('should unsubsribe only one listener', () => {
        const mock = jasmine.createSpyObj('mock', ['eventHandler', 'eventHandlerAnother']);

        events.on('event', mock.eventHandler);
        events.on('event', mock.eventHandlerAnother);
        events.emit('event', true);

        expect(mock.eventHandler).toHaveBeenCalledTimes(1);
        expect(mock.eventHandlerAnother).toHaveBeenCalledTimes(1);

        events.un('event', mock.eventHandler);
        events.emit('event', true);
        expect(mock.eventHandler).toHaveBeenCalledTimes(1);
        expect(mock.eventHandlerAnother).toHaveBeenCalledTimes(2);
    });

    it('should unsubsribe all listeners', () => {
        const mock = jasmine.createSpyObj('mock', ['eventHandler', 'eventHandlerAnother']);

        events.on('event', mock.eventHandler);
        events.on('event', mock.eventHandlerAnother);
        events.emit('event', true);

        expect(mock.eventHandler).toHaveBeenCalledTimes(1);
        expect(mock.eventHandlerAnother).toHaveBeenCalledTimes(1);

        events.un('event');
        events.emit('event', true);
        expect(mock.eventHandler).toHaveBeenCalledTimes(1);
        expect(mock.eventHandlerAnother).toHaveBeenCalledTimes(1);
    });
});
