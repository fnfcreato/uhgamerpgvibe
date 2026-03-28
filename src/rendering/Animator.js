export class Animator {
    constructor(spriteSheet) {
        this.spriteSheet = spriteSheet;
        this._currentAnim = null;
        this._frameIndex = 0;
        this._timer = 0;
        this._frameDuration = 0.1;
        this._loop = true;
        this._playing = false;
        this._onComplete = null;
        this._events = new Map();
    }

    play(animationName, { frameDuration = 0.1, loop = true, onComplete = null, events = null } = {}) {
        if (this._currentAnim === animationName && this._playing) return;
        this._currentAnim = animationName;
        this._frameIndex = 0;
        this._timer = 0;
        this._frameDuration = frameDuration;
        this._loop = loop;
        this._playing = true;
        this._onComplete = onComplete;
        this._events = new Map();
        if (events) {
            for (const [frame, cb] of Object.entries(events)) {
                this._events.set(Number(frame), cb);
            }
        }
    }

    update(dt) {
        if (!this._playing || !this._currentAnim) return;

        const frames = this.spriteSheet.getFrames(this._currentAnim);
        if (frames.length === 0) return;

        this._timer += dt;
        while (this._timer >= this._frameDuration) {
            this._timer -= this._frameDuration;
            this._frameIndex++;

            if (this._events.has(this._frameIndex)) {
                this._events.get(this._frameIndex)();
            }

            if (this._frameIndex >= frames.length) {
                if (this._loop) {
                    this._frameIndex = 0;
                } else {
                    this._frameIndex = frames.length - 1;
                    this._playing = false;
                    if (this._onComplete) this._onComplete();
                    return;
                }
            }
        }
    }

    getCurrentFrame() {
        if (!this._currentAnim) return null;
        return this.spriteSheet.getFrame(this._currentAnim, this._frameIndex);
    }

    draw(ctx, x, y, flipX = false) {
        const frame = this.getCurrentFrame();
        if (!frame) return;

        const dx = x - frame.anchorX;
        const dy = y - frame.anchorY;

        if (flipX) {
            ctx.save();
            ctx.scale(-1, 1);
            ctx.drawImage(
                this.spriteSheet.image,
                frame.x, frame.y, frame.w, frame.h,
                -(dx + frame.w), dy, frame.w, frame.h
            );
            ctx.restore();
        } else {
            ctx.drawImage(
                this.spriteSheet.image,
                frame.x, frame.y, frame.w, frame.h,
                dx, dy, frame.w, frame.h
            );
        }
    }

    get currentAnimation() {
        return this._currentAnim;
    }

    get isPlaying() {
        return this._playing;
    }

    get frameIndex() {
        return this._frameIndex;
    }
}
