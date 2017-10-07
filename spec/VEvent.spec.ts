import { VEvent } from '../src/VEvent';

describe('VEvent', () => {
    it('should work stopPropagation', () => {
        const event = new VEvent('alert');

        expect(event.name).toBe('alert');
        expect(event.isStopped()).toBe(false);
        event.stopPropagation();
        expect(event.isStopped()).toBe(true);
    });
});
