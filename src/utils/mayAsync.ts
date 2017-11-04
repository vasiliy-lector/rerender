import { isPromise } from '../Promise';

export function mayAsync(result: any, callback: (payload: any) => any, errorCallback: (error: any) => any) {
    return isPromise(result)
        ? result.then(callback).catch(errorCallback)
        : callback(result);
}
