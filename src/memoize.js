export default function memoize(fn) {
    let lastResult;
    let lastArgs;

    return function(...args) {
        if (lastArgs && args.length === lastArgs.length) {
            let same = true;

            for (let i = 0, l = args.length; i < l; i++) {
                if (args[i] === lastArgs[i]) {
                    same = false;
                }
            }

            if (same) {
                return lastResult;
            }
        }
        lastArgs = args;
        lastResult = fn(...args);

        return lastResult;
    };
}
