export class BattleTransition {
    constructor() {
        this._timer = 0;
        this._duration = 0.6;
        this._complete = false;
    }

    start() {
        this._timer = 0;
        this._complete = false;
    }

    update(dt) {
        this._timer += dt;
        if (this._timer >= this._duration) {
            this._complete = true;
        }
    }

    isComplete() {
        return this._complete;
    }

    render(ctx) {
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;
        const p = Math.min(this._timer / this._duration, 1);

        if (p < 0.3) {
            const alpha = p / 0.3;
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fillRect(0, 0, w, h);
        } else if (p < 0.6) {
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, w, h);
        } else {
            const fade = (p - 0.6) / 0.4;
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = `rgba(0, 0, 0, ${fade})`;
            ctx.fillRect(0, 0, w, h);
        }
    }
}
