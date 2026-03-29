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
        set(col, H - 3, ICE_PATH);
    }
    for (let row = 14; row <= 18; row++) {
        set(W - 2, row, ICE_PATH);
        set(W - 1, row, ICE_PATH);
    }

    for (let row = 2; row < H - 2; row++) {
        for (let col = 2; col < W - 2; col++) {
            if ((col + row * 2) % 9 <= 1) set(col, row, ICE);
            if ((col * 3 + row * 5) % 29 === 0) deco(col, row, SNOW);
        }
    }

    for (let row = 14; row <= H - 3; row++) {
        set(21, row, ICE_PATH);
        set(22, row, ICE_PATH);
        set(23, row, ICE_PATH);
    }
    for (let col = 21; col <= W - 3; col++) {
        set(col, 15, ICE_PATH);
        set(col, 16, ICE_PATH);
        if (col < 28) set(col, 17, ICE_PATH);
    }
    for (let col = 10; col <= 24; col++) {
        set(col, 24, ICE_PATH);
        set(col, 25, ICE_PATH);
    }

    fillRect(13, 4, 28, 12, DEEP_ICE);
    fillRect(15, 6, 26, 10, ICE);
    for (let col = 18; col <= 22; col++) {
        set(col, 11, ICE_PATH);
        deco(col, 5, CRYSTAL);
    }
    for (let row = 4; row <= 12; row++) {
        set(12, row, ICE_WALL, true);
        set(29, row, ICE_WALL, true);
    }
    for (let col = 12; col <= 29; col++) {
        set(col, 3, ICE_WALL, true);
        set(col, 13, ICE_WALL, true);
    }
    for (let col = 18; col <= 22; col++) {
        set(col, 13, ICE_PATH);
    }

    fillRect(4, 20, 12, 28, ICE_WALL, true);
    fillRect(5, 21, 11, 27, SNOW);
    fillRect(6, 22, 10, 26, ICE);
    for (let col = 7; col <= 9; col++) {
        deco(col, 22, CRYSTAL);
        deco(col, 26, CRYSTAL);
    }
    set(12, 24, ICE_PATH);
    set(12, 25, ICE_PATH);

    fillRect(31, 6, 38, 12, ICE_WALL, true);
    fillRect(32, 7, 37, 11, DEEP_ICE);
    fillRect(33, 20, 39, 28, ICE_WALL, true);
    fillRect(34, 21, 38, 27, ICE);
    set(33, 15, ICE_PATH);
    set(33, 16, ICE_PATH);

    for (let row = 18; row <= 31; row++) {
        set(28, row, ICE_WALL, true);
        if (row % 2 === 0) deco(27, row, CRYSTAL);
    }
    for (let col = 28; col <= 34; col++) {
        set(col, 19, ICE_WALL, true);
    }

    for (let row = 4; row <= 30; row++) {
        for (let col = 4; col <= 40; col++) {
            if ((col * 5 + row * 7) % 19 === 0) deco(col, row, CRYSTAL);
            if ((col * 11 + row * 3) % 23 === 0 && ground[index(col, row)] !== ICE_PATH) deco(col, row, ICE_PATH);
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
