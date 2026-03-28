export class Camera {
    constructor(viewWidth, viewHeight) {
        this.x = 0;
        this.y = 0;
        this._viewWidth = viewWidth;
        this._viewHeight = viewHeight;
        this._targetX = 0;
        this._targetY = 0;
        this._shakeX = 0;
        this._shakeY = 0;
        this._shakeDuration = 0;
        this._shakeIntensity = 0;
        this._lerpSpeed = 5;
    }

    follow(x, y) {
        this._targetX = x;
        this._targetY = y;
    }

    shake(intensity, duration) {
        this._shakeIntensity = intensity;
        this._shakeDuration = duration;
    }

    update(dt) {
        this.x += (this._targetX - this.x) * this._lerpSpeed * dt;
        this.y += (this._targetY - this.y) * this._lerpSpeed * dt;

        if (this._shakeDuration > 0) {
            this._shakeDuration -= dt;
            this._shakeX = (Math.random() - 0.5) * 2 * this._shakeIntensity;
            this._shakeY = (Math.random() - 0.5) * 2 * this._shakeIntensity;
        } else {
            this._shakeX = 0;
            this._shakeY = 0;
        }
    }

    worldToScreen(x, y) {
        return {
            x: Math.round(x - this.x + this._viewWidth / 2 + this._shakeX),
            y: Math.round(y - this.y + this._viewHeight / 2 + this._shakeY),
        };
    }
}
