type EqualityFunction = (arg: any, prevArg: any) => boolean;

export function memoize(
    fn: (...args: any[]) => any,
    equalityFunctions: Array<EqualityFunction | undefined> = [],
    initialValues?: any[],
    initialResult?: any
) {
    let lastResult: any = initialResult;
    let lastArgs: any[] | void = initialValues;

    return function(...args: any[]): any {
        if (lastArgs) {
            let same = true;
            for (let i = 0, l = args.length; i < l; i++) {
                const equalityFunction = equalityFunctions[i];
                if (args[i] !== lastArgs[i] && !(equalityFunction && equalityFunction(args[i], lastArgs[i]))) {
                    same = false;
                }
            }

            if (same && args.length === lastArgs.length) {
                return lastResult;
            }
        }

        lastArgs = args;
        lastResult = fn(...args);

        return lastResult;
    };
}
