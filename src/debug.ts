/* tslint:disable: no-console */
export const debug = {
    log(...args: any[]) {
        console.log(...args);
    },
    warn(...args: any[]) {
        console.warn(...args);
    },
    error(...args: any[]) {
        console.error(...args);
    }
};

interface Mesuarements {
    [key: string]: number;
}

const mesuarements: Mesuarements = {};

export function performanceStart(type: string) {
    if (typeof performance === 'undefined') {
        return;
    }

    mesuarements[type] = performance.now();
}

export function performanceEnd(type: string) {
    if (typeof performance === 'undefined') {
        return;
    }

    debug.log(`${type} took ${(performance.now() - mesuarements[type]).toFixed(3)}ms`);
}
