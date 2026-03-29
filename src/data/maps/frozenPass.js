const W = 45;
const H = 35;
const ICE = 20;
const ICE_WALL = 21;
const ICE_PATH = 22;
const DEEP_ICE = 23;
const SNOW = 24;
const CRYSTAL = 25;

function generate() {
    const ground = new Array(W * H).fill(SNOW);
    const decoration = new Array(W * H).fill(0);
    const collision = new Array(W * H).fill(0);

    function index(col, row) {
        return row * W + col;
    }

    function set(col, row, tile, solid = false) {
        if (col < 0 || col >= W || row < 0 || row >= H) return;
        const i = index(col, row);
        ground[i] = tile;
        if (solid) collision[i] = 1;
        else if (tile !== ICE_WALL) collision[i] = 0;
    }

    function deco(col, row, tile) {
        if (col < 0 || col >= W || row < 0 || row >= H) return;
        decoration[index(col, row)] = tile;
    }

    function fillRect(col0, row0, col1, row1, tile, solid = false) {
        for (let row = row0; row <= row1; row++) {
            for (let col = col0; col <= col1; col++) {
                set(col, row, tile, solid);
            }
        }
    }

    for (let col = 0; col < W; col++) {
        set(col, 0, ICE_WALL, true);
        set(col, 1, ICE_WALL, true);
        set(col, H - 1, ICE_WALL, true);
        set(col, H - 2, ICE_WALL, true);
    }
    for (let row = 0; row < H; row++) {
        set(0, row, ICE_WALL, true);
        set(1, row, ICE_WALL, true);
        set(W - 1, row, ICE_WALL, true);
        set(W - 2, row, ICE_WALL, true);
    }

    for (let col = 20; col <= 24; col++) {
        set(col, H - 2, ICE_PATH);
        set(col, H - 1, ICE_PATH);
    }
    for (let row = 15; row <= 18; row++) {
        set(W - 2, row, ICE_PATH);
        set(W - 1, row, ICE_PATH);
    }

    for (let row = 2; row < H - 2; row++) {
        for (let col = 2; col < W - 2; col++) {
            const band = (col + row * 2) % 7;
            if (band <= 1) set(col, row, ICE);
            if (band === 5) set(col, row, DEEP_ICE);
        }
    }

    for (let col = 21; col <= 23; col++) {
        for (let row = 2; row < H - 2; row++) {
            set(col, row, ICE_PATH);
        }
    }
    for (let row = 16; row <= 17; row++) {
        for (let col = 21; col < W - 2; col++) {
            set(col, row, ICE_PATH);
        }
    }

    fillRect(6, 6, 15, 12, ICE_WALL, true);
    fillRect(7, 7, 14, 11, ICE);
    set(10, 12, ICE_PATH);
    set(11, 12, ICE_PATH);

    fillRect(28, 7, 38, 13, ICE_WALL, true);
    fillRect(29, 8, 37, 12, DEEP_ICE);
    set(28, 10, ICE_PATH);
    set(28, 11, ICE_PATH);

    fillRect(10, 21, 17, 28, ICE_WALL, true);
    fillRect(11, 22, 16, 27, SNOW);

    fillRect(29, 22, 37, 29, ICE_WALL, true);
    fillRect(30, 23, 36, 28, ICE);

    for (let row = 4; row <= 30; row++) {
        for (let col = 4; col <= 40; col++) {
            if ((col * 5 + row * 3) % 17 === 0) deco(col, row, CRYSTAL);
            if ((col * 7 + row * 4) % 23 === 0) deco(col, row, ICE_PATH);
        }
    }

    return {
        width: W,
        height: H,
        tileSize: 16,
        layers: {
            ground,
            decoration,
            foreground: new Array(W * H).fill(0),
        },
        collision,
    };
}

export const FROZEN_PASS_MAP = generate();
