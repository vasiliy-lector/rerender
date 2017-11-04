import { Component } from './Component';

export function createController(Wrapper: typeof Component, noOptions?: boolean) {
    return noOptions ? { controller: Wrapper } : (options: any) => ({
        controller: Wrapper,
        options
    });
}
