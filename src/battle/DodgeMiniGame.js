const POSITION_POOL = [
    { x: 64, y: 46 },
    { x: 160, y: 38 },
    { x: 256, y: 46 },
    { x: 96, y: 76 },
    { x: 224, y: 76 },
    { x: 64, y: 108 },
    { x: 160, y: 96 },
    { x: 256, y: 108 },
];

const DODGE_RING_START_RADIUS = 34;
const DODGE_TARGET_RADIUS = 14;
const DODGE_EARLY_WINDOW = 8;
const DODGE_LATE_WINDOW = 3;
const DODGE_SPEED_SCALE = 0.78;

export class DodgeMiniGame {
    constructor(pattern, centerX, centerY, options = {}) {
        this._centerX = centerX;
        this._centerY = centerY;
        this._speedMultiplier = options.speedMultiplier || 1;

        this._circles = pattern.map((p, index) => {
            const position = POSITION_POOL[index % POSITION_POOL.length];
            return {
                key: p.key,
                label: p.label,
                speed: p.speed || 1.0,
                x: position.x,
                y: position.y,
                ringRadius: DODGE_RING_START_RADIUS,
                targetRadius: DODGE_TARGET_RADIUS,
                earlyWindow: DODGE_EARLY_WINDOW,
                lateWindow: DODGE_LATE_WINDOW,
                state: 'waiting',
                resultTimer: 0,
                resultLabel: '',
            };
        });

        this._currentIndex = 0;
        if (this._circles.length > 0) {
            this._circles[0].state = 'active';
        }
        this._complete = false;
        this._results = [];
    }

    pressKey(keyCode) {
        if (this._currentIndex >= this._circles.length) return;
        const circle = this._circles[this._currentIndex];
        if (circle.state !== 'active') return;

        const diff = circle.ringRadius - circle.targetRadius;
        const inWindow = diff >= -circle.lateWindow && diff <= circle.earlyWindow;

        if (keyCode === circle.key && inWindow) {
            circle.state = 'dodged';
            circle.resultLabel = 'DODGED!';
        } else if (keyCode !== circle.key) {
            circle.state = 'hit';
            circle.resultLabel = 'WRONG KEY!';
        } else {
            circle.state = 'hit';
            circle.resultLabel = 'BAD TIMING!';
        }
        circle.resultTimer = 0.45;
    }

    update(dt) {
        if (this._currentIndex >= this._circles.length) {
            this._complete = true;
            return;
        }

        const circle = this._circles[this._currentIndex];

        if (circle.state === 'active') {
            circle.ringRadius -= circle.speed * this._speedMultiplier * 36 * DODGE_SPEED_SCALE * dt;

            if (circle.ringRadius < circle.targetRadius - circle.lateWindow) {
                circle.state = 'hit';
                circle.resultLabel = 'TOO LATE!';
                circle.resultTimer = 0.45;
            }
        }

        if (circle.state === 'dodged' || circle.state === 'hit') {
            circle.resultTimer -= dt;
            if (circle.resultTimer <= 0) {
                this._results.push(circle.state === 'dodged');
                this._currentIndex++;
                if (this._currentIndex < this._circles.length) {
                    this._circles[this._currentIndex].state = 'active';
                } else {
                    this._complete = true;
                }
            }
        }
    }

    get isComplete() {
        return this._complete;
    }

    getResults() {
        const dodgedCount = this._results.filter((result) => result).length;
        return { dodgedCount, totalCircles: this._circles.length };
    }

    render(ctx) {
        if (this._currentIndex >= this._circles.length) return;
        const circle = this._circles[this._currentIndex];
        const cx = circle.x;
        const cy = circle.y;
        const tr = circle.targetRadius;

        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(cx, cy, tr, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#888';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, tr, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(80, 220, 120, 0.18)';
        ctx.beginPath();
        ctx.arc(cx, cy, tr + circle.earlyWindow, 0, Math.PI * 2);
        ctx.arc(cx, cy, Math.max(1, tr - circle.lateWindow), 0, Math.PI * 2, true);
        ctx.fill();

        ctx.strokeStyle = '#4a4';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, tr + circle.earlyWindow, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(circle.label, cx, cy);

        if (circle.state === 'active') {
            const diff = circle.ringRadius - tr;
            const inGreen = diff >= -circle.lateWindow && diff <= circle.earlyWindow;

            ctx.strokeStyle = inGreen ? '#4f4' : '#f84';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(cx, cy, Math.max(0, circle.ringRadius), 0, Math.PI * 2);
            ctx.stroke();
        }

        if (circle.state === 'dodged') {
            const alpha = Math.min(1, circle.resultTimer / 0.2);
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = '#4f4';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(cx, cy, tr + 4, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
        if (circle.state === 'hit') {
            const alpha = Math.min(1, circle.resultTimer / 0.2);
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = '#f44';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(cx, cy, tr + 4, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        if ((circle.state === 'dodged' || circle.state === 'hit') && circle.resultTimer > 0) {
            const alpha = Math.min(1, circle.resultTimer / 0.2);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = circle.state === 'dodged' ? '#4f4' : '#f44';
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(circle.resultLabel, cx, cy - tr - 8);
            ctx.globalAlpha = 1;
        }

        const dotStartX = this._centerX - (this._circles.length * 4);
        for (let i = 0; i < this._circles.length; i++) {
            let color = '#444';
            if (i < this._results.length) {
                color = this._results[i] ? '#4f4' : '#f44';
            } else if (i === this._currentIndex) {
                color = '#ff8';
            }
            ctx.fillStyle = color;
            ctx.fillRect(dotStartX + i * 8, this._centerY + 38, 6, 4);
        }

        ctx.textAlign = 'left';
    }
}
