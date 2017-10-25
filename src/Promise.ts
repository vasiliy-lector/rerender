import { identity } from './utils';

type Status = 'pending' | 'resolved' | 'rejected';
type Callback<T> = (payload: T) => any;
type ErrorPayload = any;
type ErrorCallback = (error: ErrorPayload) => any;
type ResolveFunction<T> = (payload: T | Promise<T>) => void;
type RejectFunction = (error: ErrorPayload) => void;
type ConstructorFunction<T> = (resolve: ResolveFunction<T>, reject: RejectFunction) => void;

export class Promise<T> {

    public static resolve = <T>(payload: T): Promise<T> => {
        return new Promise(resolve => resolve(payload));
    }
    public static reject = (error: ErrorPayload): Promise<any> => {
        return new Promise((resolve, reject) => reject(error));
    }

    private status: Status = 'pending';
    private value?: T | ErrorPayload;
    private fulfilledCallbacks?: Array<Callback<T>>;
    private rejectedCallbacks?: ErrorCallback[];

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

    public then(onFulfilled: Callback<T> = identity, onRejected: ErrorCallback = identity) {
        if (this.status === 'resolved') {
            return Promise.resolve(onFulfilled(this.value as T));
        } else if (this.status === 'rejected') {
            return Promise.reject(onRejected(this.value as ErrorPayload));
        } else {
            return new Promise((resolve: ResolveFunction<T>, reject: RejectFunction) => {
                (this.fulfilledCallbacks || (this.fulfilledCallbacks = []))
                    .push((payload: T) => resolve(onFulfilled(payload)));
                (this.rejectedCallbacks || (this.rejectedCallbacks = []))
                    .push((error: ErrorPayload) => reject(onRejected(error)));
            });
        }
    }

    public catch(onRejected: ErrorCallback = identity) {
        if (this.status === 'rejected') {
            return Promise.reject(onRejected(this.value as ErrorPayload));
        } else if (this.status === 'pending') {
            return new Promise((resolve: ResolveFunction<T>, reject: RejectFunction): any => {
                (this.fulfilledCallbacks || (this.fulfilledCallbacks = []))
                    .push((payload: T) => resolve(payload));
                (this.rejectedCallbacks || (this.rejectedCallbacks = []))
                    .push((error: ErrorPayload) => reject(onRejected(error)));
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

    private reject(error: ErrorPayload): void {
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
