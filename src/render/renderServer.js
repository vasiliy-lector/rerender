import { createInstance } from './jsx';

function renderServer(render, store) {
    const jsx = createInstance({
        store,
        stringify: true
    });

    return render({ jsx }).exec('__r__');
}

export default renderServer;