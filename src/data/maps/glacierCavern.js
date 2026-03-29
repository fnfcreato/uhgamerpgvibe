const W = 42;
const H = 32;
const ICE = 20;
const ICE_WALL = 21;
const ICE_PATH = 22;
const DEEP_ICE = 23;
const SNOW = 24;
const CRYSTAL = 25;

function generate() {
    const ground = new Array(W * H).fill(DEEP_ICE);
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

    for (let row = 14; row <= 18; row++) {
        set(0, row, ICE_PATH);
        set(1, row, ICE_PATH);
    }

    fillRect(2, 2, W - 3, H - 3, DEEP_ICE);
    fillRect(4, 11, 17, 20, ICE);
    fillRect(23, 6, 37, 15, ICE);
    fillRect(11, 22, 19, 27, SNOW);
    fillRect(24, 20, 35, 27, ICE);

    for (let col = 2; col <= 18; col++) {
        set(col, 15, ICE_PATH);
        set(col, 16, ICE_PATH);
    }
    for (let row = 11; row <= 23; row++) {
        set(18, row, ICE_PATH);
        set(19, row, ICE_PATH);
    }
    for (let col = 18; col <= 36; col++) {
        set(col, 11, ICE_PATH);
        set(col, 12, ICE_PATH);
    }
    for (let col = 18; col <= 31; col++) {
        set(col, 23, ICE_PATH);
        set(col, 24, ICE_PATH);
    }

    fillRect(9, 4, 16, 9, ICE_WALL, true);
    fillRect(10, 5, 15, 8, DEEP_ICE);
    fillRect(22, 17, 26, 22, ICE_WALL, true);
    fillRect(23, 18, 25, 21, DEEP_ICE);
    fillRect(31, 18, 36, 25, ICE_WALL, true);
    fillRect(32, 19, 35, 24, ICE);
    fillRect(6, 23, 9, 28, ICE_WALL, true);
    fillRect(27, 4, 31, 8, ICE_WALL, true);

    fillRect(13, 21, 17, 26, SNOW);
    deco(14, 22, CRYSTAL);
    deco(16, 24, CRYSTAL);
    deco(15, 26, CRYSTAL);

    for (let row = 5; row <= 27; row++) {
        if (row < 14 || row > 18) {
            set(21, row, ICE_WALL, true);
        }
    }
    for (let col = 21; col <= 29; col++) {
        set(col, 18, ICE_WALL, true);
    }
    for (let col = 12; col <= 28; col++) {
        if (col !== 18 && col !== 19) {
            set(col, 20, ICE_WALL, true);
        }
    }

    for (let row = 4; row <= H - 5; row++) {
        for (let col = 4; col <= W - 5; col++) {
            if ((col * 3 + row * 9) % 17 === 0) deco(col, row, CRYSTAL);
            if ((col * 5 + row * 2) % 21 === 0 && ground[index(col, row)] !== ICE_PATH) deco(col, row, ICE_PATH);
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

export const GLACIER_CAVERN_MAP = generate();
