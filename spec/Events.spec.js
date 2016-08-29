import Events from '../src/Events';

describe('Events', () => {
    let events,
        fn,
        fn2;

    beforeEach(() => {
        events = new Events();
        fn = jasmine.createSpy();
        fn2 = jasmine.createSpy();
    });

    describe('method on', () => {
        it('should properly set callback for single event', () => {
            events.on('click', fn);
            expect(events.callbacks).toEqual({
                click: [fn]
            });
        });

        it('should properly set callback for multiple events', () => {
            events.on('click,mousedown,keyup', fn);
            expect(events.callbacks).toEqual({
                click: [fn],
                mousedown: [fn],
                keyup: [fn]
            });
        });

        it('should ignore double addition same callback', () => {
            events.on('click', fn);
            events.on('click', fn);
            expect(events.callbacks).toEqual({
                click: [fn]
            });
        });
    });

    describe('method emit', () => {
        it('should call callbacks', () => {
            events.on('click', fn);
            expect(fn).not.toHaveBeenCalled();

            events.emit('click');
            expect(fn).toHaveBeenCalled();
        });

        it('should proceed without error if no callbacks set on event', () => {
            expect(events.callbacks).toEqual({});
            events.emit('click');
        });
    });

    describe('method un', () => {
        it('should unsibscribe specified callback', () => {
            events.on('click', fn);
            expect(events.callbacks).toEqual({
                click: [fn]
            });
            events.un('click', fn);
            expect(events.callbacks).toEqual({
                click: []
            });
        });

        it('should unsibscribe all callbacks', () => {
            events.on('click', fn);
            events.on('click', fn2);
            expect(events.callbacks).toEqual({
                click: [fn, fn2]
            });
            events.un('click');
            expect(events.callbacks).toEqual({
                click: []
            });
        });

        it('should proceed without error if no callbacks set on event', () => {
            expect(events.callbacks).toEqual({});
            events.un('click', fn);
        });
    });
});
