function componentBeforeRender(instance) {
    if (!instance._componentMounted && typeof instance.componentWillMount !== 'undefined') {
        instance.componentWillMount();
    }
}

function componentDestroy(instance) {
    if (typeof instance.componentWillDestroy !== 'undefined') {
        instance.componentWillDestroy();
    }
}

function componentUpdate(instance) {
    if (typeof instance.componentDidUpdate !== 'undefined') {
        instance.componentDidUpdate();
    }
}

function componentMount(instance) {
    instance._componentMounted = true;

    if (typeof instance.componentDidMount !== 'undefined') {
        instance.componentDidMount();
    }
}

function componentRender(instance) {
    return instance.render();
}

function componentSetProps(instance, props, children) {
    if (typeof instance.componentWillReceiveProps !== 'undefined') {
        instance._settingProps = true;
        instance.componentWillReceiveProps(props, children);
        instance._settingProps = false;
    }

    instance.props = props;
    instance.children = children;
}

function componentUnmount(instance) {
    instance._componentMounted = false;

    if (typeof instance.componentWillUnmount !== 'undefined') {
        instance.componentWillUnmount();
    }
}

export {
    componentBeforeRender,
    componentDestroy,
    componentUpdate,
    componentMount,
    componentRender,
    componentSetProps,
    componentUnmount
};
