const W = 50;
const H = 40;
const CORRUPTED_GROUND = 10;
const CORRUPTED_WALL = 11;
const CORRUPTED_PATH = 12;
const DEEP_CORRUPTION = 13;
const GRASS = 1;
const STONE = 5;
const GRASS_VAR = 6;

function generate() {
    const ground = new Array(W * H).fill(DEEP_CORRUPTION);
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

    for (let row = 18; row <= 21; row++) {
        set(0, row, CORRUPTED_PATH, false);
        set(1, row, CORRUPTED_PATH, false);
        set(W - 2, row, CORRUPTED_PATH, false);
        set(W - 1, row, CORRUPTED_PATH, false);
    }

    for (let row = 2; row < H - 2; row++) {
        for (let col = 2; col < W - 2; col++) {
            if (col % 4 === 0 && row % 3 !== 1) set(col, row, CORRUPTED_WALL, true);
            if (row % 5 === 0 && col % 4 !== 1) set(col, row, CORRUPTED_WALL, true);
        }
    }

    function clear(col, row, tile = CORRUPTED_PATH) {
        set(col, row, tile, false);
    }

    for (let col = 2; col <= 13; col++) {
        clear(col, 19);
        clear(col, 20);
    }
    for (let row = 10; row <= 20; row++) {
        clear(12, row);
        clear(13, row);
    }
    for (let col = 13; col <= 25; col++) {
        clear(col, 10);
        clear(col, 11);
    }
    for (let row = 11; row <= 29; row++) {
        clear(24, row);
        clear(25, row);
    }
    for (let col = 25; col <= 37; col++) {
        clear(col, 27);
        clear(col, 28);
    }
    for (let row = 14; row <= 28; row++) {
        clear(36, row);
        clear(37, row);
    }
    for (let col = 37; col <= 47; col++) {
        clear(col, 14);
        clear(col, 15);
    }
    for (let row = 15; row <= 20; row++) {
        clear(46, row);
        clear(47, row);
    }

    fillRect(5, 6, 11, 12, GRASS);
    fillRect(6, 7, 10, 11, GRASS_VAR);
    for (let col = 5; col <= 11; col++) {
        setDeco(col, 6, STONE);
        setDeco(col, 12, STONE);
    }
    for (let row = 6; row <= 12; row++) {
        setDeco(5, row, STONE);
        setDeco(11, row, STONE);
    }
    clear(10, 10);
    clear(11, 10);

    fillRect(15, 7, 23, 14, CORRUPTED_GROUND);
    for (let row = 8; row <= 13; row++) {
        for (let col = 16; col <= 22; col++) {
            if ((col + row) % 2 === 0) setDeco(col, row, 12);
        }
    }

    fillRect(28, 23, 35, 31, CORRUPTED_GROUND);
    fillRect(29, 24, 34, 30, DEEP_CORRUPTION);
    for (let row = 24; row <= 30; row++) {
        setDeco(28, row, 13);
        setDeco(35, row, 12);
    }

    fillRect(39, 5, 45, 9, CORRUPTED_GROUND);
    fillRect(16, 30, 22, 36, CORRUPTED_GROUND);
    fillRect(39, 29, 44, 34, CORRUPTED_GROUND);

    for (let row = 4; row <= 35; row++) {
        for (let col = 3; col <= 46; col++) {
            if ((col * 7 + row * 11) % 21 === 0) setDeco(col, row, 10);
            if ((col * 5 + row * 4) % 23 === 0) setDeco(col, row, 12);
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

export const CORRUPTED_ZONE_3_MAP = generate();
