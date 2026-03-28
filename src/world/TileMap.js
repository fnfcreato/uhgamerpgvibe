export class TileMap {
    constructor(data) {
        this.width = data.width;
        this.height = data.height;
        this.tileSize = data.tileSize;
        this.layers = data.layers;
        this.collision = data.collision;
    }

    getTile(layer, col, row) {
        if (col < 0 || col >= this.width || row < 0 || row >= this.height) return 0;
        const tiles = this.layers[layer];
        if (!tiles) return 0;
        return tiles[row * this.width + col];
    }

    isSolid(col, row) {
        if (col < 0 || col >= this.width || row < 0 || row >= this.height) return true;
        return this.collision[row * this.width + col] === 1;
    }

    isSolidAt(pixelX, pixelY) {
        const col = Math.floor(pixelX / this.tileSize);
        const row = Math.floor(pixelY / this.tileSize);
        return this.isSolid(col, row);
    }

    get pixelWidth() {
        return this.width * this.tileSize;
    }

    get pixelHeight() {
        return this.height * this.tileSize;
    }
}
