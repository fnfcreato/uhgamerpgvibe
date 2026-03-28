export class Entity {
    constructor(x, y, width, height) {
        this.position = { x, y };
        this.size = { w: width, h: height };
        this.animator = null;
        this.active = true;
    }

    update(dt) { }

    render(ctx, camera) { }
}
