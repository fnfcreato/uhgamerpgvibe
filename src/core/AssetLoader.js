export class AssetLoader {
    constructor() {
        this._images = new Map();
        this._audio = new Map();
        this._totalAssets = 0;
        this._loadedAssets = 0;
    }

    loadImage(id, src) {
        this._totalAssets++;
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this._images.set(id, img);
                this._loadedAssets++;
                resolve(img);
            };
            img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
            img.src = src;
        });
    }

    loadAudio(id, src) {
        this._totalAssets++;
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.oncanplaythrough = () => {
                this._audio.set(id, audio);
                this._loadedAssets++;
                resolve(audio);
            };
            audio.onerror = () => reject(new Error(`Failed to load audio: ${src}`));
            audio.src = src;
        });
    }

    async loadAll(manifest, onProgress) {
        const promises = [];
        for (const { type, id, src } of manifest) {
            let p;
            if (type === 'image') {
                p = this.loadImage(id, src);
            } else if (type === 'audio') {
                p = this.loadAudio(id, src);
            }
            if (p) {
                promises.push(p.then(() => {
                    if (onProgress) onProgress(this._loadedAssets, this._totalAssets);
                }));
            }
        }
        await Promise.all(promises);
    }

    getImage(id) {
        return this._images.get(id);
    }

    getAudio(id) {
        return this._audio.get(id);
    }

    getProgress() {
        if (this._totalAssets === 0) return 1;
        return this._loadedAssets / this._totalAssets;
    }
}
