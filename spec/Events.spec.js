import Events from '../src/Events';

describe('Events', () => {
    let events,
        fn = jasmine.createSpy();

    beforeEach(() => {
        events = new Events();
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
    });

    describe('method emit', () => {
        it('should call callbacks', () => {
            events.on('click', fn);
            expect(fn).not.toHaveBeenCalled();

            events.emit('click');
            expect(fn).toHaveBeenCalled();
        });
    });
});
