function componentInit(instance) {
    if (typeof instance.init === 'function') {
        instance.init();
    }
}

function componentBeforeRender(instance) {
    if (!instance.componentMounted && typeof instance.componentWillMount !== 'undefined') {
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
    instance.componentMounted = true;

    if (typeof instance.componentDidMount !== 'undefined') {
        instance.componentDidMount();
    }
}

function componentSetProps(instance, props, additional) {
    if (typeof instance.componentWillReceiveProps !== 'undefined') {
        instance.settingProps = true;
        instance.componentWillReceiveProps(props, additional);
        instance.settingProps = false;
    }

    instance.props = props;
}

function componentUnmount(instance) {
    instance.componentMounted = false;

    if (typeof instance.componentWillUnmount !== 'undefined') {
        instance.componentWillUnmount();
    }
}

export {
    componentInit,
    componentBeforeRender,
    componentDestroy,
    componentUpdate,
    componentMount,
    componentSetProps,
    componentUnmount
};
