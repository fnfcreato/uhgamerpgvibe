import { CANVAS } from '../data/constants.js';

const TILE_COLORS = {
    1: '#3a6e3a',
    2: '#555555',
    3: '#8b7a4a',
    4: '#2d5a2d',
    5: '#6a6a6a',
    6: '#4a7a4a',
    10: '#3a1a3a',
    11: '#4a2a4a',
    12: '#5a3a4a',
    13: '#2a0a2a',
    14: '#3a1a1a',
    15: '#5a2a2a',
    20: '#c7ebff',
    21: '#8ba8c9',
    22: '#e8f7ff',
    23: '#8fd3ff',
    24: '#f8fcff',
    25: '#d8fbff',
};

const WALL_TOP_COLOR = '#444444';
const WALL_FACE_COLOR = '#333333';
const CORRUPTED_WALL_TOP_COLOR = '#3a1a3a';
const CORRUPTED_WALL_FACE_COLOR = '#2a0a2a';
const ARENA_WALL_TOP_COLOR = '#4a1a1a';
const ARENA_WALL_FACE_COLOR = '#3a0a0a';
const ICE_WALL_TOP_COLOR = '#b8d8f8';
const ICE_WALL_FACE_COLOR = '#87afd6';

export class TileRenderer {
    render(ctx, tileMap, camera) {
        const ts = tileMap.tileSize;
        const halfW = CANVAS.INTERNAL_WIDTH / 2;
        const halfH = CANVAS.INTERNAL_HEIGHT / 2;

        const startCol = Math.max(0, Math.floor((camera.x - halfW) / ts) - 1);
        const endCol = Math.min(tileMap.width - 1, Math.ceil((camera.x + halfW) / ts));
        const startRow = Math.max(0, Math.floor((camera.y - halfH) / ts) - 1);
        const endRow = Math.min(tileMap.height - 1, Math.ceil((camera.y + halfH) / ts));

        const layerOrder = ['ground', 'decoration'];
        for (const layerName of layerOrder) {
            if (!tileMap.layers[layerName]) continue;
            for (let row = startRow; row <= endRow; row++) {
                for (let col = startCol; col <= endCol; col++) {
                    const tileId = tileMap.getTile(layerName, col, row);
                    if (tileId === 0) continue;

                    const screen = camera.worldToScreen(col * ts, row * ts);
                    if (layerName === 'decoration') {
                        this._renderDecorationTile(ctx, tileId, screen.x, screen.y, ts);
                        continue;
                    }

                    if (tileId === 2) {
                        ctx.fillStyle = WALL_TOP_COLOR;
                        ctx.fillRect(screen.x, screen.y, ts, ts - 4);
                        ctx.fillStyle = WALL_FACE_COLOR;
                        ctx.fillRect(screen.x, screen.y + ts - 4, ts, 4);
                    } else if (tileId === 11) {
                        ctx.fillStyle = CORRUPTED_WALL_TOP_COLOR;
                        ctx.fillRect(screen.x, screen.y, ts, ts - 4);
                        ctx.fillStyle = CORRUPTED_WALL_FACE_COLOR;
                        ctx.fillRect(screen.x, screen.y + ts - 4, ts, 4);
                    } else if (tileId === 15) {
                        ctx.fillStyle = ARENA_WALL_TOP_COLOR;
                        ctx.fillRect(screen.x, screen.y, ts, ts - 4);
                        ctx.fillStyle = ARENA_WALL_FACE_COLOR;
                        ctx.fillRect(screen.x, screen.y + ts - 4, ts, 4);
                    } else if (tileId === 21) {
                        ctx.fillStyle = ICE_WALL_TOP_COLOR;
                        ctx.fillRect(screen.x, screen.y, ts, ts - 4);
                        ctx.fillStyle = ICE_WALL_FACE_COLOR;
                        ctx.fillRect(screen.x, screen.y + ts - 4, ts, 4);
                    } else {
                        ctx.fillStyle = TILE_COLORS[tileId] || '#ff00ff';
                        ctx.fillRect(screen.x, screen.y, ts, ts);
                    }
                }
            }
        }
    }

    _renderDecorationTile(ctx, tileId, x, y, ts) {
        const colors = {
            3: '#9a8856',
            5: '#9aa3ad',
            6: '#7ec07e',
            10: '#8f4d8f',
            12: '#b07bd2',
            13: '#d05b8e',
            22: '#f7fdff',
            24: '#ffffff',
            25: '#c7fbff',
        };

        const color = colors[tileId] || TILE_COLORS[tileId] || '#ff00ff';
        ctx.save();
        ctx.fillStyle = color;

        if (tileId === 3 || tileId === 5) {
            ctx.globalAlpha = 0.85;
            ctx.fillRect(x + 4, y + 4, ts - 8, ts - 8);
            ctx.fillRect(x + 2, y + 6, 3, 3);
            ctx.fillRect(x + ts - 5, y + 7, 2, 2);
        } else if (tileId === 6) {
            ctx.globalAlpha = 0.9;
            ctx.fillRect(x + 3, y + 9, 2, 4);
            ctx.fillRect(x + 7, y + 5, 2, 8);
            ctx.fillRect(x + 11, y + 8, 2, 5);
        } else if (tileId === 10 || tileId === 12) {
            ctx.globalAlpha = 0.85;
            ctx.fillRect(x + 2, y + 7, ts - 4, 2);
            ctx.fillRect(x + 6, y + 3, 2, ts - 6);
            ctx.fillRect(x + 10, y + 8, 3, 3);
        } else if (tileId === 13) {
            ctx.globalAlpha = 0.95;
            ctx.fillRect(x + 3, y + 3, ts - 6, ts - 6);
            ctx.fillStyle = '#12050f';
            ctx.globalAlpha = 0.9;
            ctx.fillRect(x + 6, y + 6, ts - 12, ts - 12);
        } else if (tileId === 22 || tileId === 24) {
            ctx.globalAlpha = 0.9;
            ctx.fillRect(x + 2, y + 2, ts - 4, ts - 4);
            ctx.fillStyle = 'rgba(180, 240, 255, 0.9)';
            ctx.fillRect(x + 5, y + 4, 2, ts - 8);
            ctx.fillRect(x + 9, y + 3, 2, ts - 6);
        } else if (tileId === 25) {
            ctx.globalAlpha = 0.95;
            ctx.fillRect(x + 7, y + 2, 2, ts - 4);
            ctx.fillRect(x + 3, y + 7, ts - 6, 2);
            ctx.fillRect(x + 5, y + 5, 6, 6);
        } else {
            ctx.globalAlpha = 0.8;
            ctx.fillRect(x + 3, y + 3, ts - 6, ts - 6);
        }

        ctx.restore();
    }

    renderForeground(ctx, tileMap, camera) {
        if (!tileMap.layers.foreground) return;
        const ts = tileMap.tileSize;
        const halfW = CANVAS.INTERNAL_WIDTH / 2;
        const halfH = CANVAS.INTERNAL_HEIGHT / 2;

        const startCol = Math.max(0, Math.floor((camera.x - halfW) / ts) - 1);
        const endCol = Math.min(tileMap.width - 1, Math.ceil((camera.x + halfW) / ts));
        const startRow = Math.max(0, Math.floor((camera.y - halfH) / ts) - 1);
        const endRow = Math.min(tileMap.height - 1, Math.ceil((camera.y + halfH) / ts));

        for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
                const tileId = tileMap.getTile('foreground', col, row);
                if (tileId === 0) continue;
                const screen = camera.worldToScreen(col * ts, row * ts);
                ctx.fillStyle = TILE_COLORS[tileId] || '#ff00ff';
                ctx.fillRect(screen.x, screen.y, ts, ts);
            }
        }
    }

    renderCorruptionOverlay(ctx, corruptionProfile) {
        ctx.fillStyle = corruptionProfile.tint;
        ctx.fillRect(0, 0, CANVAS.INTERNAL_WIDTH, CANVAS.INTERNAL_HEIGHT);
    }
}
