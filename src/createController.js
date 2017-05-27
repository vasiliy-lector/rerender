export default function createController (Wrapper) {
    return options => ({
        controller: Wrapper,
        options
    });
}
