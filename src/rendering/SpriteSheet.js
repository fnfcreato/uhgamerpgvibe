export class SpriteSheet {
    constructor(image, config) {
        this.image = image;
        this._frames = new Map();

        if (config.frameWidth && config.frameHeight) {
            const cols = Math.floor(image.width / config.frameWidth);
            const rows = Math.floor(image.height / config.frameHeight);
            const anchorX = config.anchorX || 0;
            const anchorY = config.anchorY || 0;

            if (config.animations) {
                for (const [name, anim] of Object.entries(config.animations)) {
                    const frames = [];
                    const row = anim.row;
                    const count = anim.count || cols;
                    for (let col = 0; col < count; col++) {
                        frames.push({
                            x: col * config.frameWidth,
                            y: row * config.frameHeight,
                            w: config.frameWidth,
                            h: config.frameHeight,
                            anchorX,
                            anchorY,
                        });
                    }
                    this._frames.set(name, frames);
                }
            } else {
                for (let row = 0; row < rows; row++) {
                    const frames = [];
                    for (let col = 0; col < cols; col++) {
                        frames.push({
                            x: col * config.frameWidth,
                            y: row * config.frameHeight,
                            w: config.frameWidth,
                            h: config.frameHeight,
                            anchorX,
                            anchorY,
                        });
                    }
                    this._frames.set(`row_${row}`, frames);
                }
            }
        }

        if (config.customFrames) {
            for (const [name, frameDefs] of Object.entries(config.customFrames)) {
                const frames = frameDefs.map(f => ({
                    x: f.x,
                    y: f.y,
                    w: f.w,
                    h: f.h,
                    anchorX: f.anchorX || 0,
                    anchorY: f.anchorY || 0,
                }));
                this._frames.set(name, frames);
            }
        }
    }

    getFrames(animationName) {
        return this._frames.get(animationName) || [];
    }

    getFrame(animationName, frameIndex) {
        const frames = this._frames.get(animationName);
        if (!frames || frames.length === 0) return null;
        return frames[frameIndex % frames.length];
    }

    hasAnimation(name) {
        return this._frames.has(name);
    }

    getAnimationNames() {
        return [...this._frames.keys()];
    }
}
