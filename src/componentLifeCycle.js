function beforeRender(instance) {
    if (!instance._componentMounted && typeof instance.componentWillMount !== 'undefined') {
        instance.componentWillMount();
    }
}

function destroy(instance) {
    if (typeof instance.componentWillDestroy !== 'undefined') {
        instance.componentWillDestroy();
    }
}

function update(instance) {
    if (typeof instance.componentDidUpdate !== 'undefined') {
        instance.componentDidUpdate();
    }
}

function mount(instance) {
    instance._componentMounted = true;

    if (typeof instance.componentDidMount !== 'undefined') {
        instance.componentDidMount();
    }
}

function render(instance) {
    return instance.render();
}

function setProps(instance, props, children) {
    if (typeof instance.componentWillReceiveProps !== 'undefined') {
        instance._settingProps = true;
        instance.componentWillReceiveProps(props, children);
        instance._settingProps = false;
    }

    instance.props = props;
    instance.children = children;
}

function unmount(instance) {
    instance._componentMounted = false;

    if (typeof instance.componentWillUnmount !== 'undefined') {
        instance.componentWillUnmount();
    }
}

export default {
    beforeRender,
    destroy,
    update,
    mount,
    render,
    setProps,
    unmount
};
