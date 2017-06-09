import Promise from '../src/Promise';

let string = '';

describe('Promise', () => {
    it('should support basic functionality', () => {
        var p1 = new Promise(function(resolve) { resolve('foo'); });
        var p2 = new Promise(function(resolve, reject) { reject('quux'); });
        var score = 0;

        function thenFn(result)  { score += (result === 'foo'); }
        function catchFn(result) { score += (result === 'quux'); }
        function shouldNotRun()  { score = -Infinity; }

        p1.then(thenFn, shouldNotRun);
        p2.then(shouldNotRun, catchFn);
        p1.catch(shouldNotRun);
        p2.catch(catchFn);

        p1.then(function() {
            // Promise.prototype.then() should return a new Promise
            score += p1.then() !== p1;
        });

        expect(score).toBe(4);
    });

    it('should work sync', () => {
        Promise.resolve('hello').then(payload => {
            string += payload + ' ';
        });
        string += 'world!';

        expect(string).toBe('hello world!');
    });
});
