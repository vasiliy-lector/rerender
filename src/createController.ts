import { Component } from './Component';
import { ComponentType, Controller } from './types';

export function createController(Wrapper: ComponentType<any>, noOptions?: boolean): Controller {
    return noOptions ? { controller: Wrapper } : (options: any) => ({
        controller: Wrapper,
        options
    });
}
