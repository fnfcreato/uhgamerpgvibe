import { UIElement } from './UIElement.js';
import { PixelText } from '../rendering/PixelText.js';

export class Button extends UIElement {
    static _sfxPlayer = null;

    static setSFXPlayer(player) {
        Button._sfxPlayer = player;
    }

    constructor(x, y, width, height, label, callback) {
        super(x, y, width, height);
        this.label = label;
        this.callback = callback;
        this.hovered = false;
        this.pressed = false;
        this.disabled = false;
        this._pressTimer = 0;
    }

    updatePointer(pointerPos) {
        this.hovered = !this.disabled && this.containsPoint(pointerPos.x, pointerPos.y);
    }

    activate() {
        if (this.disabled) {
            return;
        }

        this.pressed = true;
        this._pressTimer = 0.1;
        if (Button._sfxPlayer) {
            Button._sfxPlayer('menu_confirm');
        }
        if (this.callback) this.callback();
    }

    update(dt) {
        if (this._pressTimer > 0) {
            this._pressTimer -= dt;
            if (this._pressTimer <= 0) this.pressed = false;
        }
    }

    draw(ctx) {
        if (!this.visible) return;

        const isActive = !this.disabled && (this.hovered || this.focused);
        const baseColor = this.disabled ? '#1f1f1f' : this.pressed ? '#666' : isActive ? '#555' : '#393939';
        const borderColor = this.disabled ? '#444' : this.focused ? '#fff' : '#777';
        const textColor = this.disabled ? '#777' : '#fff';
        const label = PixelText.fitText(ctx, this.label, this.width - 8, { size: 8 });

        ctx.fillStyle = '#222';
        ctx.fillRect(this.x + 1, this.y + 1, this.width, this.height);

        ctx.fillStyle = baseColor;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x + 0.5, this.y + 0.5, this.width - 1, this.height - 1);

        PixelText.draw(ctx, label, this.x + this.width / 2, this.y + this.height / 2, {
            color: textColor,
            align: 'center',
            baseline: 'middle',
        });
    }
}
