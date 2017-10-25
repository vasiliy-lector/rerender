import { Promise } from '../src/Promise';

let s = '';

describe('Promise', () => {
    it('should support basic functionality', () => {
        const p1 = new Promise(function(resolve) { resolve('foo'); });
        const p2 = new Promise(function(resolve, reject) { reject('quux'); });
        let score = 0;

        function thenFn(result: string)  { score += Number(result === 'foo'); }
        function catchFn(result: string) { score += Number(result === 'quux'); }
        function shouldNotRun()  { score = -Infinity; }

        p1.then(thenFn, shouldNotRun);
        p2.then(shouldNotRun, catchFn);
        p1.catch(shouldNotRun);
        p2.catch(catchFn);

        p1.then(function() {
            // Promise.prototype.then() should return a new Promise
            score += Number(p1.then() !== p1);
        });

        expect(score).toBe(4);
    });

    it('should call callbacks after resolving', () => {
        let callback1: number;
        let callback2: number;
        let callback3: number;

        (new Promise(resolve => {
            setTimeout(() => resolve(1), 0);
        }))
            .then((value: number) => {
                callback1 = value;
                return 2;
            })
            .then((value: number) => {
                callback2 = value;
                return 3;
            })
            .then((value: number) => {
                callback3 = value;
                check();
            });

        function check() {
            expect(callback1).toBe(1);
            expect(callback2).toBe(2);
            expect(callback3).toBe(3);
        }
    });

    it('should call callbacks for already resolved promise', () => {
        let callback1 = 0;
        let callback2 = 0;
        let callback3 = 0;

        Promise.resolve(1)
            .then((value: number) => {
                callback1 = value;
                return 2;
            })
            .then((value: number) => {
                callback2 = value;
                return 3;
            })
            .then((value: number) => {
                callback3 = value;
            });

        expect(callback1).toBe(1);
        expect(callback2).toBe(2);
        expect(callback3).toBe(3);
    });

    it('should work sync', () => {
        Promise.resolve('hello').then(payload => {
            s += payload + ' ';
        });
        s += 'world!';

        expect(s).toBe('hello world!');
    });
});
