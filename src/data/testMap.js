const W = 50;
const H = 40;
const GRASS = 1;
const WALL = 2;
const PATH = 3;
const DARK_GRASS = 4;
const STONE_FLOOR = 5;
const GRASS_VAR = 6;

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
        else if (tile !== WALL) collision[i] = 0;
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

    function decoRect(col0, row0, col1, row1, tile) {
        for (let row = row0; row <= row1; row++) {
            for (let col = col0; col <= col1; col++) {
                setDeco(col, row, tile);
            }
        }
    }

    for (let col = 0; col < W; col++) {
        set(col, 0, WALL, true);
        set(col, 1, WALL, true);
        set(col, H - 1, WALL, true);
        set(col, H - 2, WALL, true);
    }
    for (let row = 0; row < H; row++) {
        set(0, row, WALL, true);
        set(1, row, WALL, true);
        set(W - 1, row, WALL, true);
        set(W - 2, row, WALL, true);
    }

    for (let row = 18; row <= 21; row++) {
        set(W - 2, row, PATH, false);
        set(W - 1, row, PATH, false);
    }

    fillRect(19, 15, 30, 24, STONE_FLOOR);
    decoRect(20, 16, 29, 23, 5);
    decoRect(22, 18, 27, 21, 3);

    for (let row = 2; row <= 15; row++) {
        for (let col = 23; col <= 26; col++) {
            set(col, row, PATH);
        }
    }
    for (let row = 25; row <= H - 3; row++) {
        for (let col = 23; col <= 26; col++) {
            set(col, row, PATH);
        }
    }
    for (let col = 2; col <= 18; col++) {
        set(col, 19, PATH);
        set(col, 20, PATH);
    }
    for (let col = 31; col <= W - 2; col++) {
        set(col, 19, PATH);
        set(col, 20, PATH);
    }

    fillRect(16, 4, 33, 11, WALL, true);
    fillRect(17, 5, 32, 10, STONE_FLOOR);
    for (let row = 5; row <= 10; row++) {
        set(17, row, WALL, true);
        set(32, row, WALL, true);
    }
    for (let col = 23; col <= 26; col++) {
        set(col, 11, PATH, false);
        set(col, 12, STONE_FLOOR, false);
    }
    decoRect(20, 6, 29, 8, 5);
    decoRect(22, 9, 27, 9, 3);
    setDeco(19, 6, 6);
    setDeco(30, 6, 6);
    setDeco(19, 9, 6);
    setDeco(30, 9, 6);

    fillRect(34, 7, 46, 17, WALL, true);
    fillRect(35, 8, 45, 16, STONE_FLOOR);
    for (let row = 8; row <= 16; row++) {
        set(35, row, STONE_FLOOR, false);
        set(45, row, WALL, true);
    }
    for (let row = 11; row <= 13; row++) {
        set(34, row, PATH, false);
        set(35, row, STONE_FLOOR, false);
        set(33, row, PATH, false);
    }
    decoRect(37, 9, 43, 10, 5);
    decoRect(37, 12, 43, 15, 3);
    setDeco(42, 13, 10);
    setDeco(42, 14, 10);

    fillRect(3, 7, 15, 17, WALL, true);
    fillRect(4, 8, 14, 16, STONE_FLOOR);
    for (let row = 8; row <= 16; row++) {
        set(3, row, WALL, true);
        set(14, row, STONE_FLOOR, false);
    }
    for (let row = 11; row <= 13; row++) {
        set(15, row, PATH, false);
        set(14, row, STONE_FLOOR, false);
        set(16, row, PATH, false);
    }
    decoRect(6, 9, 12, 10, 5);
    decoRect(7, 12, 11, 15, 6);

    fillRect(9, 27, 18, 33, DARK_GRASS);
    fillRect(31, 27, 40, 33, DARK_GRASS);
    fillRect(20, 29, 29, 35, GRASS_VAR);
    decoRect(10, 28, 17, 32, 6);
    decoRect(32, 28, 39, 32, 6);
    decoRect(22, 30, 27, 34, 3);

    for (let col = 8; col <= 18; col++) {
        if (col !== 13 && col !== 14) {
            set(col, 26, WALL, true);
        }
    }
    for (let col = 30; col <= 40; col++) {
        if (col !== 35 && col !== 36) {
            set(col, 26, WALL, true);
        }
    }

    for (let row = 4; row <= 7; row++) {
        for (let col = 4; col <= 8; col++) {
            set(col, row, DARK_GRASS);
            setDeco(col, row, 6);
        }
    }
    for (let row = 31; row <= 36; row++) {
        for (let col = 13; col <= 18; col++) {
            set(col, row, GRASS_VAR);
            if ((col + row) % 2 === 0) setDeco(col, row, 6);
        }
    }
    for (let row = 31; row <= 36; row++) {
        for (let col = 30; col <= 35; col++) {
            set(col, row, GRASS_VAR);
            if ((col + row) % 2 === 1) setDeco(col, row, 6);
        }
    }

    for (let col = 19; col <= 30; col++) {
        setDeco(col, 14, 5);
        setDeco(col, 25, 5);
    }
    for (let row = 15; row <= 24; row++) {
        setDeco(18, row, 5);
        setDeco(31, row, 5);
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

export const TEST_MAP = generate();
