import { identity } from './utils';

type Status = 'pending' | 'resolved' | 'rejected';
type Callback<T, R> = (payload: T) => R;
type ErrorCallback<R> = (error: any) => R;
type ResolveFunction<T> = (payload: T | Promise<T>) => void;
type RejectFunction = (error: any) => void;
type ConstructorFunction<T> = (resolve: ResolveFunction<T>, reject: RejectFunction) => void;

export class Promise<T> {

    public static resolve = <T>(payload: T): Promise<T> => {
        return new Promise(resolve => resolve(payload));
    }
    public static reject = (error: any): Promise<never> => {
        return new Promise((resolve, reject) => reject(error));
    }

    private status: Status = 'pending';
    private value?: any;
    private fulfilledCallbacks?: Array<Callback<T, any>>;
    private rejectedCallbacks?: Array<ErrorCallback<any>>;

    constructor(fn: ConstructorFunction<T>) {
        try {
            if (typeof fn !== 'function') {
                throw new Error('Promise resolver ' + typeof fn + ' is not a function');
            }

            this.resolve = this.resolve.bind(this);
            this.reject = this.reject.bind(this);

            fn(this.resolve, this.reject);
        } catch (error) {
            this.reject(error);
        }
    }

    public then<R1 = T, R2 = never>(onFulfilled?: Callback<T, R1>, onRejected?: ErrorCallback<R2>): Promise<R1 | R2> {
        if (this.status === 'resolved') {
            return Promise.resolve(onFulfilled ? onFulfilled(this.value) : this.value);
        } else if (this.status === 'rejected') {
            return Promise.reject(onRejected ? onRejected(this.value) : this.value) as Promise<never>;
        } else {
            return new Promise<R1 | R2>((resolve: ResolveFunction<R1 | R2>, reject: RejectFunction) => {
                (this.fulfilledCallbacks || (this.fulfilledCallbacks = []))
                    .push((payload: T) => resolve(onFulfilled ? onFulfilled(payload) : this.value));
                (this.rejectedCallbacks || (this.rejectedCallbacks = []))
                    .push((error: any) => reject(onRejected ? onRejected(error) : this.value));
            });
        }
    }

    public catch<R1 = never>(onRejected: ErrorCallback<R1>): Promise<T | R1> {
        if (this.status === 'rejected') {
            return Promise.reject(onRejected(this.value));
        } else if (this.status === 'pending') {
            return new Promise((resolve: ResolveFunction<T>, reject: RejectFunction): any => {
                (this.fulfilledCallbacks || (this.fulfilledCallbacks = []))
                    .push((payload: T) => resolve(payload));
                (this.rejectedCallbacks || (this.rejectedCallbacks = []))
                    .push((error: any) => reject(onRejected(error)));
            });
        } else {
            return this;
        }
    }

    private resolve(payload: T | Promise<T>): void {
        if (this.status === 'pending') {
            if (isPromise(payload)) {
                payload.then(this.resolve, this.reject);
            } else {
                this.status = 'resolved';
                this.value = payload;

                if (this.fulfilledCallbacks) {
                    for (let i = 0, l = this.fulfilledCallbacks.length; i < l; i++) {
                        this.fulfilledCallbacks[i](payload as T);
                    }
                }
            }
        }
    }

    private reject(error: any): void {
        if (this.status === 'pending') {
            this.status = 'rejected';
            this.value = error;

            if (this.rejectedCallbacks) {
                for (let i = 0, l = this.rejectedCallbacks.length; i < l; i++) {
                    this.rejectedCallbacks[i](error);
                }
            }
        }
    }
}

export function isPromise<T>(payload: any): payload is Promise<T> {
    return payload instanceof Promise
        || (payload !== null && typeof payload === 'object'
        && typeof payload.then === 'function' && typeof payload.catch === 'function');
}
