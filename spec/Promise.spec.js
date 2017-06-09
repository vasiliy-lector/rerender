import Promise from '../src/Promise';

let string = '';

describe('Promise', () => {
    it('should work sync', () => {
        Promise.resolve('hello').then(payload => {
            string += payload + ' ';
        });
        string += 'world!';

        expect(string).toBe('hello world!');
    });
});
