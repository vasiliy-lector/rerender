function Event(name, {
    cache = false,
    userIndependent = false,
    action,
    reducers
}) {
    if (!name) {
        throw new Error('Required not empty name for event');
    }

    this.name = name;
    this.cache = cache;
    this.userIndependent = userIndependent;
    this.action = action;
    this.reducers = reducers;
}

export default Event;
