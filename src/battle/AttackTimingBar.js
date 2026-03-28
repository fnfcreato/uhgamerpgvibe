import { TIMING } from '../data/constants.js';

export class AttackTimingBar {
    constructor(swordDef) {
        this.swordDef = swordDef;
        this.barSpeed = swordDef.barSpeed;
        this.barCount = swordDef.barCount;
        this.baseDamage = swordDef.damage;

        this._position = 0;
        this._active = true;
        this._currentPress = 0;
        this._results = [];
        this._complete = false;
        this._showResultTimer = 0;
        this._lastResult = null;
    }

    press() {
        if (!this._active || this._showResultTimer > 0) return;

        const mult = this._getMultiplier(this._position);
        const label = this._getLabel(this._position);
        this._results.push({ mult, label });
        this._lastResult = { mult, label };
        this._currentPress++;
        this._showResultTimer = 0.4;
        this._position = 0;

        if (this._currentPress >= this.barCount) {
            this._active = false;
        }
    }

    _getMultiplier(pos) {
        const dist = Math.abs(pos - 0.5);
        if (dist <= TIMING.PERFECT_ZONE) return TIMING.PERFECT_MULT;
        if (dist <= TIMING.HIGH_ZONE) return TIMING.HIGH_MULT;
        return TIMING.OUTER_MULT;
    }

    _getLabel(pos) {
        const dist = Math.abs(pos - 0.5);
        if (dist <= TIMING.PERFECT_ZONE) return 'PERFECT!';
        if (dist <= TIMING.HIGH_ZONE) return 'GREAT!';
        return 'OK';
    }

    update(dt) {
        if (this._showResultTimer > 0) {
            this._showResultTimer -= dt;
            if (this._showResultTimer <= 0 && this._currentPress >= this.barCount) {
                this._complete = true;
            }
            return;
        }

        if (!this._active) return;

        this._position += this.barSpeed * dt;
        if (this._position >= 1.0) {
            this._results.push({ mult: 0, label: 'MISS!' });
            this._lastResult = { mult: 0, label: 'MISS!' };
            this._currentPress++;
            this._showResultTimer = 0.4;
            this._position = 0;

            if (this._currentPress >= this.barCount) {
                this._active = false;
            }
        }
    }

    get isComplete() {
        return this._complete;
    }

    getResults() {
        const hits = this._results.filter(r => r.mult > 0);
        const hitCount = hits.length;
        const avgMult = hitCount > 0 ? hits.reduce((s, r) => s + r.mult, 0) / hitCount : 0;
        return {
            timingMult: avgMult,
            hitCount,
            results: this._results,
        };
    }

    render(ctx, x, y, width, height) {
        // Zone backgrounds
        const zw = width;

        ctx.fillStyle = '#822';
        ctx.fillRect(x, y, zw * 0.25, height);

        ctx.fillStyle = '#886622';
        ctx.fillRect(x + zw * 0.25, y, zw * 0.15, height);

        ctx.fillStyle = '#2a7a2a';
        ctx.fillRect(x + zw * 0.4, y, zw * 0.2, height);

        ctx.fillStyle = '#886622';
        ctx.fillRect(x + zw * 0.6, y, zw * 0.15, height);

        ctx.fillStyle = '#822';
        ctx.fillRect(x + zw * 0.75, y, zw * 0.25, height);

        // Center mark
        ctx.fillStyle = '#fff';
        ctx.fillRect(x + width / 2 - 1, y - 2, 2, height + 4);

        // Moving cursor
        if (this._active && this._showResultTimer <= 0) {
            const cursorX = x + this._position * width;
            ctx.fillStyle = '#fff';
            ctx.fillRect(cursorX - 2, y - 3, 4, height + 6);
        }

        // Border
        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);

        // Slash progress dots
        for (let i = 0; i < this.barCount; i++) {
            const dotColor = i < this._currentPress
                ? (this._results[i].mult >= 1 ? '#4f4' : this._results[i].mult > 0 ? '#ff4' : '#f44')
                : '#444';
            ctx.fillStyle = dotColor;
            ctx.fillRect(x + width / 2 - (this.barCount * 4) + i * 8, y + height + 4, 6, 4);
        }

        // Result label
        if (this._lastResult && this._showResultTimer > 0) {
            const alpha = Math.min(1, this._showResultTimer / 0.15);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = this._lastResult.mult >= 1 ? '#4f4'
                : this._lastResult.mult > 0 ? '#ff4' : '#f44';
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(this._lastResult.label, x + width / 2, y - 6);
            ctx.globalAlpha = 1;
            ctx.textAlign = 'left';
        }
    }
}
