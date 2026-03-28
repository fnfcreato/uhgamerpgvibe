export class EffectManager {
    constructor() {
        this._effects = [];
    }

    spawn(effect) {
        this._effects.push(effect);
    }

    update(dt) {
        this._effects = this._effects.filter(e => {
            e.update(dt);
            return !e.isDead;
        });
    }

    render(ctx, camera) {
        for (const e of this._effects) {
            e.render(ctx, camera);
        }
    }

    clear() {
        this._effects = [];
    }
}
