export default function createController (Wrapper, noOptions) {
    return noOptions ? { controller: Wrapper } : options => ({
        controller: Wrapper,
        options
    });
}
