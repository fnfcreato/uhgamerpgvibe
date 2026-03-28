const W = 30;
const H = 25;
const ARENA_FLOOR = 14;
const ARENA_WALL = 15;
const CORRUPTED_PATH = 12;
const DEEP_CORRUPTION = 13;

function generate() {
    const ground = new Array(W * H).fill(DEEP_CORRUPTION);
    const collision = new Array(W * H).fill(0);

    function set(col, row, tile, solid = false) {
        if (col < 0 || col >= W || row < 0 || row >= H) return;
        const i = row * W + col;
        ground[i] = tile;
        if (solid) collision[i] = 1;
    }

    // Border: arena walls (2 tiles thick)
    for (let col = 0; col < W; col++) {
        set(col, 0, ARENA_WALL, true);
        set(col, 1, ARENA_WALL, true);
        set(col, H - 1, ARENA_WALL, true);
        set(col, H - 2, ARENA_WALL, true);
    }
    for (let row = 0; row < H; row++) {
        set(0, row, ARENA_WALL, true);
        set(1, row, ARENA_WALL, true);
        set(W - 1, row, ARENA_WALL, true);
        set(W - 2, row, ARENA_WALL, true);
    }

    // === Single entrance at bottom (col 14-15, row 23-24) ===
    set(14, H - 1, CORRUPTED_PATH, false); set(15, H - 1, CORRUPTED_PATH, false);
    set(14, H - 2, CORRUPTED_PATH, false); set(15, H - 2, CORRUPTED_PATH, false);
    collision[(H - 1) * W + 14] = 0;
    collision[(H - 1) * W + 15] = 0;
    collision[(H - 2) * W + 14] = 0;
    collision[(H - 2) * W + 15] = 0;

    // === Oval arena in center ===
    // Center of the arena
    const cx = 15;
    const cy = 11;
    const rx = 11; // horizontal radius
    const ry = 7;  // vertical radius

    // Fill oval with arena floor
    for (let row = 2; row < H - 2; row++) {
        for (let col = 2; col < W - 2; col++) {
            const dx = (col - cx) / rx;
            const dy = (row - cy) / ry;
            if (dx * dx + dy * dy <= 1.0) {
                set(col, row, ARENA_FLOOR);
            }
        }
    }

    // Arena wall ring (just outside the oval)
    for (let row = 2; row < H - 2; row++) {
        for (let col = 2; col < W - 2; col++) {
            const dx = (col - cx) / rx;
            const dy = (row - cy) / ry;
            const dist = dx * dx + dy * dy;
            // Ring between 1.0 and 1.15
            if (dist > 1.0 && dist <= 1.2) {
                set(col, row, ARENA_WALL, true);
            }
        }
    }

    // === Entrance corridor from bottom into oval ===
    // Clear path from entrance to arena
    for (let row = cy + ry; row < H - 2; row++) {
        set(14, row, ARENA_FLOOR);
        set(15, row, ARENA_FLOOR);
        collision[row * W + 14] = 0;
        collision[row * W + 15] = 0;
    }
    // Clear any arena wall tiles blocking the corridor
    for (let row = cy + ry - 1; row <= cy + ry + 1; row++) {
        set(14, row, ARENA_FLOOR);
        set(15, row, ARENA_FLOOR);
        collision[row * W + 14] = 0;
        collision[row * W + 15] = 0;
    }

    // === Boss spawn point marker (center-top of arena) ===
    // The boss spawns near row ~5, col 15 (center-top of oval)
    // No special tile needed, just keep it clear arena floor

    return {
        width: W,
        height: H,
        tileSize: 16,
        layers: {
            ground,
            decoration: new Array(W * H).fill(0),
            foreground: new Array(W * H).fill(0),
        },
        collision,
    };
}

export const FINAL_ARENA_MAP = generate();
