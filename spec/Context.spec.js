import Context from '../src/Context';

describe('Context', () => {
    it('should create context for node', () => {
        const isDomNode = true;
        const parentId = 1;
        const index = 2;
        const parentPosition = '.childNodes[0]';
        const domIndex = 3;
        const parent = { type: 'c' };
        const parentNode = { type: 'n'};
        const key = '$key';
        const uniqid = '$uniqid';
        const inheritableKey = '$inheritableKey';
        const inheritableUniqid = '$inheritableUniqid';

        const context = new Context({
            isDomNode,
            parentId,
            index,
            parentPosition,
            domIndex,
            parent,
            parentNode,
            key,
            uniqid,
            inheritableKey,
            inheritableUniqid
        });

        expect(context.isDomNode).toEqual(isDomNode);
        expect(context.parentId).toEqual(parentId);
        expect(context.index).toEqual(index);
        expect(context.parentPosition).toEqual(parentPosition);
        expect(context.domIndex).toEqual(domIndex);
        expect(context.parent).toEqual(parent);
        expect(context.parentNode).toEqual(parentNode);
        expect(context.id).toEqual(uniqid);
        expect(context.position).toEqual('.childNodes[0].childNodes[3]');
    });

    it('should create context for component', () => {
        const isDomNode = false;
        const parentId = 1;
        const index = 2;
        const parentPosition = '.childNodes[0]';
        const domIndex = 3;
        const parent = { type: 'c' };
        const parentNode = { type: 'n'};
        const key = '$key';
        const uniqid = '$uniqid';
        const inheritableKey = '$inheritableKey';
        const inheritableUniqid = '$inheritableUniqid';

        const context = new Context({
            isDomNode,
            parentId,
            index,
            parentPosition,
            domIndex,
            parent,
            parentNode,
            key,
            uniqid,
            inheritableKey,
            inheritableUniqid
        });

        expect(context.isDomNode).toEqual(isDomNode);
        expect(context.parentId).toEqual(parentId);
        expect(context.index).toEqual(index);
        expect(context.parentPosition).toEqual(parentPosition);
        expect(context.domIndex).toEqual(domIndex);
        expect(context.parent).toEqual(parent);
        expect(context.parentNode).toEqual(parentNode);
        expect(context.inheritableKey).toEqual(key);
        expect(context.inheritableUniqid).toEqual(uniqid);
        expect(context.id).toEqual(uniqid);
    });
});
