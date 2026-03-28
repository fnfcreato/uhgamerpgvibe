const W = 45;
const H = 35;
const CORRUPTED_GROUND = 10;
const CORRUPTED_WALL = 11;
const CORRUPTED_PATH = 12;
const DEEP_CORRUPTION = 13;
const GRASS = 1;
const DARK_GRASS = 4;
const STONE = 5;
const GRASS_VAR = 6;

function generate() {
    const ground = new Array(W * H).fill(CORRUPTED_GROUND);
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
        else if (tile !== CORRUPTED_WALL) collision[i] = 0;
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
        set(0, row, CORRUPTED_PATH, false);
        set(1, row, CORRUPTED_PATH, false);
        set(W - 2, row, CORRUPTED_PATH, false);
        set(W - 1, row, CORRUPTED_PATH, false);
    }

    for (let row = 2; row < H - 2; row++) {
        for (let col = 2; col < W - 2; col++) {
            if ((col * 5 + row * 9) % 13 < 4) set(col, row, DEEP_CORRUPTION);
            if ((col + row) % 7 === 0) setDeco(col, row, 10);
        }
    }

    for (let col = 2; col <= 13; col++) {
        set(col, 16, CORRUPTED_PATH);
        set(col, 17, CORRUPTED_PATH);
    }
    for (let row = 17; row <= 24; row++) {
        set(13, row, CORRUPTED_PATH);
        set(14, row, CORRUPTED_PATH);
    }
    for (let col = 14; col <= 30; col++) {
        set(col, 23, CORRUPTED_PATH);
        set(col, 24, CORRUPTED_PATH);
    }
    for (let row = 12; row <= 24; row++) {
        set(30, row, CORRUPTED_PATH);
        set(31, row, CORRUPTED_PATH);
    }
    for (let col = 31; col < W - 2; col++) {
        set(col, 16, CORRUPTED_PATH);
        set(col, 17, CORRUPTED_PATH);
    }

    fillRect(4, 27, 10, 31, GRASS);
    fillRect(5, 28, 9, 30, GRASS_VAR);
    for (let col = 4; col <= 10; col++) {
        setDeco(col, 27, STONE);
        setDeco(col, 31, STONE);
    }
    for (let row = 27; row <= 31; row++) {
        setDeco(4, row, STONE);
        setDeco(10, row, STONE);
    }
    setDeco(7, 29, GRASS_VAR);

    fillRect(7, 5, 20, 11, CORRUPTED_WALL, true);
    fillRect(8, 6, 19, 10, CORRUPTED_GROUND);
    for (let col = 12; col <= 14; col++) {
        set(col, 11, CORRUPTED_PATH, false);
    }
    for (let col = 10; col <= 17; col++) {
        if (col !== 13) setDeco(col, 8, 12);
    }

    fillRect(18, 13, 28, 19, CORRUPTED_WALL, true);
    fillRect(19, 14, 27, 18, CORRUPTED_GROUND);
    set(23, 13, CORRUPTED_PATH, false);
    set(23, 19, CORRUPTED_PATH, false);
    set(18, 16, CORRUPTED_PATH, false);
    set(28, 16, CORRUPTED_PATH, false);
    for (let row = 14; row <= 18; row++) {
        setDeco(21, row, 13);
        setDeco(25, row, 12);
    }

    fillRect(33, 20, 40, 28, CORRUPTED_WALL, true);
    fillRect(34, 21, 39, 27, DEEP_CORRUPTION);
    for (let col = 36; col <= 37; col++) {
        set(col, 20, CORRUPTED_PATH, false);
    }
    for (let row = 22; row <= 26; row++) {
        setDeco(36, row, 10);
        setDeco(37, row, 13);
    }

    fillRect(24, 4, 30, 9, CORRUPTED_GROUND);
    fillRect(25, 5, 29, 8, DEEP_CORRUPTION);
    for (let row = 4; row <= 9; row++) {
        setDeco(24, row, 12);
        setDeco(30, row, 12);
    }

    for (let row = 4; row <= 30; row++) {
        for (let col = 3; col <= 41; col++) {
            if ((col * 11 + row * 3) % 19 === 0) setDeco(col, row, 12);
            if ((col * 2 + row * 7) % 23 === 0) setDeco(col, row, 13);
        }
    }

    fillRect(3, 4, 6, 8, GRASS);
    for (let row = 28; row <= 31; row++) {
        for (let col = 12; col <= 17; col++) {
            set(col, row, DARK_GRASS);
            if ((col + row) % 2 === 0) setDeco(col, row, GRASS_VAR);
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

export const CORRUPTED_ZONE_2_MAP = generate();
