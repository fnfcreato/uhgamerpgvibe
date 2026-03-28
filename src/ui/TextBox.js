import { UIElement } from './UIElement.js';
import { CANVAS } from '../data/constants.js';
import { PixelText } from '../rendering/PixelText.js';

export class TextBox extends UIElement {
    constructor() {
        super(4, CANVAS.INTERNAL_HEIGHT - 56, CANVAS.INTERNAL_WIDTH - 8, 52);
        this.speaker = '';
        this.fullText = '';
        this._revealedChars = 0;
        this._timer = 0;
        this._charsPerSecond = 30;
        this._fullyRevealed = false;
        this._indicatorBlink = 0;
    }

    setText(speaker, text) {
        this.speaker = speaker;
        this.fullText = text;
        this._revealedChars = 0;
        this._timer = 0;
        this._fullyRevealed = false;
        this._indicatorBlink = 0;
    }

    isFullyRevealed() {
        return this._fullyRevealed;
    }

    rushReveal() {
        this._revealedChars = this.fullText.length;
        this._fullyRevealed = true;
    }

    update(dt) {
        if (this._fullyRevealed) {
            this._indicatorBlink += dt;
            return;
        }

        this._timer += dt;
        this._revealedChars = Math.floor(this._timer * this._charsPerSecond);
        if (this._revealedChars >= this.fullText.length) {
            this._revealedChars = this.fullText.length;
            this._fullyRevealed = true;
        }
    }

    draw(ctx) {
        if (!this.visible) return;

        ctx.fillStyle = 'rgba(10, 10, 20, 0.9)';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        ctx.strokeStyle = '#8888aa';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x + 0.5, this.y + 0.5, this.width - 1, this.height - 1);

        PixelText.draw(ctx, this.speaker, this.x + 6, this.y + 5, { color: '#ffdd44', size: 7 });

        const displayText = this.fullText.substring(0, this._revealedChars);
        PixelText.drawParagraph(ctx, displayText, this.x + 6, this.y + 16, {
            color: '#fff',
            size: 8,
            maxWidth: this.width - 20,
            lineHeight: 9,
            maxLines: 3,
        });

        if (this._fullyRevealed) {
            const alpha = (Math.sin(this._indicatorBlink * 5) + 1) / 2;
            PixelText.draw(ctx, 'v', this.x + this.width - 12, this.y + this.height - 10, {
                color: `rgba(255, 255, 255, ${0.4 + alpha * 0.6})`,
                size: 8,
            });
        }
    }
}
