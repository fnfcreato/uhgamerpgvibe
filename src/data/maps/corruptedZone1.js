const W = 45;
const H = 35;
const GRASS = 1;
const WALL = 2;
const PATH = 3;
const DARK_GRASS = 4;
const GRASS_VAR = 6;
const CORRUPTED_GROUND = 10;
const CORRUPTED_WALL = 11;
const CORRUPTED_PATH = 12;
const DEEP_CORRUPTION = 13;

function generate() {
    const ground = new Array(W * H).fill(GRASS);
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
        else if (tile !== CORRUPTED_WALL && tile !== WALL) collision[i] = 0;
    }

    function setDeco(col, row, tile) {
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
        set(col, 0, CORRUPTED_WALL, true);
        set(col, 1, CORRUPTED_WALL, true);
        set(col, H - 1, CORRUPTED_WALL, true);
        set(col, H - 2, CORRUPTED_WALL, true);
    }
    for (let row = 0; row < H; row++) {
        set(0, row, CORRUPTED_WALL, true);
        set(1, row, CORRUPTED_WALL, true);
        set(W - 1, row, CORRUPTED_WALL, true);
        set(W - 2, row, CORRUPTED_WALL, true);
    }

    for (let row = 15; row <= 18; row++) {
        set(0, row, PATH, false);
        set(1, row, PATH, false);
        set(W - 2, row, CORRUPTED_PATH, false);
        set(W - 1, row, CORRUPTED_PATH, false);
    }

    for (let row = 2; row < H - 2; row++) {
        for (let col = 2; col < W - 2; col++) {
            const ratio = col / W;
            if (ratio > 0.75) {
                set(col, row, DEEP_CORRUPTION);
            } else if (ratio > 0.45) {
                set(col, row, CORRUPTED_GROUND);
            } else if ((col + row) % 5 === 0) {
                set(col, row, DARK_GRASS);
            }
        }
    }

    for (let col = 2; col < W - 2; col++) {
        set(col, 16, PATH);
        set(col, 17, PATH);
        if (col % 2 === 0) setDeco(col, 16, 3);
    }
    for (let row = 9; row <= 17; row++) {
        set(8, row, PATH);
        set(9, row, PATH);
    }
    for (let row = 17; row <= 28; row++) {
        set(20, row, PATH);
        set(21, row, PATH);
    }
    for (let row = 16; row <= 24; row++) {
        set(33, row, CORRUPTED_PATH);
        set(34, row, CORRUPTED_PATH);
    }

    fillRect(4, 5, 12, 12, GRASS);
    fillRect(5, 6, 11, 11, GRASS_VAR);
    for (let col = 4; col <= 12; col++) {
        setDeco(col, 5, 5);
        setDeco(col, 12, 5);
    }
    for (let row = 5; row <= 12; row++) {
        setDeco(4, row, 5);
        setDeco(12, row, 5);
    }
    for (let row = 7; row <= 10; row++) {
        for (let col = 6; col <= 10; col++) {
            if ((col + row) % 2 === 0) setDeco(col, row, 6);
        }
    }

    fillRect(17, 6, 24, 11, CORRUPTED_WALL, true);
    fillRect(18, 7, 23, 10, CORRUPTED_GROUND);
    for (let col = 20; col <= 21; col++) {
        set(col, 11, CORRUPTED_PATH, false);
    }
    decoRect(19, 8, 22, 9, 12, decoration, W);

    fillRect(31, 8, 39, 15, CORRUPTED_WALL, true);
    fillRect(32, 9, 38, 14, CORRUPTED_GROUND);
    for (let row = 11; row <= 13; row++) {
        set(31, row, CORRUPTED_PATH, false);
    }
    for (let row = 10; row <= 14; row++) {
        setDeco(35, row, 10);
        if (row !== 12) setDeco(37, row, 12);
    }

    fillRect(28, 22, 36, 28, CORRUPTED_WALL, true);
    fillRect(29, 23, 35, 27, CORRUPTED_GROUND);
    for (let row = 24; row <= 25; row++) {
        set(28, row, CORRUPTED_PATH, false);
    }
    for (let col = 30; col <= 34; col++) {
        setDeco(col, 25, 13);
    }

    fillRect(15, 23, 24, 29, GRASS);
    fillRect(17, 24, 22, 28, GRASS_VAR);
    for (let col = 15; col <= 24; col++) {
        setDeco(col, 23, 5);
        setDeco(col, 29, 5);
    }
    for (let row = 23; row <= 29; row++) {
        setDeco(15, row, 5);
        setDeco(24, row, 5);
    }
    setDeco(19, 26, 6);
    setDeco(20, 25, 6);
    setDeco(21, 27, 6);

    for (let row = 4; row <= 30; row++) {
        for (let col = 13; col <= 42; col++) {
            if ((col * 3 + row * 5) % 11 === 0) setDeco(col, row, 10);
            if ((col * 7 + row * 2) % 17 === 0) setDeco(col, row, 12);
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

function decoRect(col0, row0, col1, row1, tile, decoration, width) {
    for (let row = row0; row <= row1; row++) {
        for (let col = col0; col <= col1; col++) {
            decoration[row * width + col] = tile;
        }
    }
}

export const CORRUPTED_ZONE_1_MAP = generate();
