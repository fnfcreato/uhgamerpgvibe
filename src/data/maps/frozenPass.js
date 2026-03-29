const W = 60;
const H = 45;
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
        else collision[i] = 0;
    }

    function deco(col, row, tile) {
        if (col < 0 || col >= W || row < 0 || row >= H) return;
        decoration[index(col, row)] = tile;
    }

    function fillRect(c0, r0, c1, r1, tile, solid = false) {
        for (let r = r0; r <= r1; r++) {
            for (let c = c0; c <= c1; c++) {
                set(c, r, tile, solid);
            }
        }
    }

    // ── 2-tile thick border walls ──────────────────────────────────
    for (let c = 0; c < W; c++) {
        set(c, 0, ICE_WALL, true);
        set(c, 1, ICE_WALL, true);
        set(c, H - 1, ICE_WALL, true);
        set(c, H - 2, ICE_WALL, true);
    }
    for (let r = 0; r < H; r++) {
        set(0, r, ICE_WALL, true);
        set(1, r, ICE_WALL, true);
        set(W - 1, r, ICE_WALL, true);
        set(W - 2, r, ICE_WALL, true);
    }

    // ── Ground fill: ICE patches on SNOW using modular patterns ───
    for (let r = 2; r < H - 2; r++) {
        for (let c = 2; c < W - 2; c++) {
            if ((c * 3 + r * 7) % 11 <= 1) set(c, r, ICE);
            if ((c * 5 + r * 2) % 17 === 0) set(c, r, ICE);
        }
    }

    // ── South exit (to town): cols 28-32, bottom 2 rows ───────────
    for (let c = 28; c <= 32; c++) {
        set(c, H - 2, ICE_PATH);
        set(c, H - 1, ICE_PATH);
        collision[index(c, H - 2)] = 0;
        collision[index(c, H - 1)] = 0;
    }

    // ── East exit (to glacier cavern): cols W-2..W-1, rows 20-23 ──
    for (let r = 20; r <= 23; r++) {
        set(W - 2, r, ICE_PATH);
        set(W - 1, r, ICE_PATH);
        collision[index(W - 2, r)] = 0;
        collision[index(W - 1, r)] = 0;
    }

    // ════════════════════════════════════════════════════════════════
    //  MAIN PATH NETWORK (3 tiles wide, winding)
    // ════════════════════════════════════════════════════════════════

    // Vertical path up from south exit (cols 29-31), row 42 → 30
    for (let r = 30; r <= H - 3; r++) {
        set(29, r, ICE_PATH); set(30, r, ICE_PATH); set(31, r, ICE_PATH);
    }

    // Curve west at row 30: cols 15–31
    for (let c = 15; c <= 31; c++) {
        set(c, 29, ICE_PATH); set(c, 30, ICE_PATH); set(c, 31, ICE_PATH);
    }

    // Continue path north from col 15-17, rows 18–30
    for (let r = 18; r <= 30; r++) {
        set(15, r, ICE_PATH); set(16, r, ICE_PATH); set(17, r, ICE_PATH);
    }

    // East branch from intersection at row 21: cols 17 → 57 (to east exit)
    for (let c = 17; c <= W - 3; c++) {
        set(c, 20, ICE_PATH); set(c, 21, ICE_PATH); set(c, 22, ICE_PATH);
    }

    // Curve the east path around the crystal cave — jog south at col 42
    // (path already covers row 20-22 straight through; add a bypass)
    for (let r = 22; r <= 26; r++) {
        set(42, r, ICE_PATH); set(43, r, ICE_PATH); set(44, r, ICE_PATH);
    }
    for (let c = 44; c <= W - 3; c++) {
        set(c, 25, ICE_PATH); set(c, 26, ICE_PATH);
    }

    // North branch from col 15-17 at row 18: goes up to row 8
    for (let r = 8; r <= 18; r++) {
        set(15, r, ICE_PATH); set(16, r, ICE_PATH); set(17, r, ICE_PATH);
    }

    // East branch at row 8-10 toward crystal cave entrance
    for (let c = 17; c <= 38; c++) {
        set(c, 8, ICE_PATH); set(c, 9, ICE_PATH); set(c, 10, ICE_PATH);
    }

    // Branch south-west from main intersection to snowy clearing
    for (let r = 31; r <= 37; r++) {
        set(14, r, ICE_PATH); set(15, r, ICE_PATH); set(16, r, ICE_PATH);
    }
    for (let c = 5; c <= 15; c++) {
        set(c, 36, ICE_PATH); set(c, 37, ICE_PATH);
    }

    // ════════════════════════════════════════════════════════════════
    //  FROZEN LAKE — center-west, 15×12 DEEP_ICE
    // ════════════════════════════════════════════════════════════════
    // SNOW border first (17×14), then DEEP_ICE interior
    fillRect(5, 11, 21, 24, SNOW);
    fillRect(6, 12, 20, 23, DEEP_ICE);

    // Irregular edges — a few SNOW tiles intruding into the lake
    set(6, 12, SNOW); set(7, 12, SNOW); set(19, 12, SNOW); set(20, 12, SNOW);
    set(6, 23, SNOW); set(7, 23, SNOW); set(19, 23, SNOW); set(20, 23, SNOW);
    set(6, 13, SNOW); set(20, 13, SNOW); set(6, 22, SNOW); set(20, 22, SNOW);

    // Small ICE island in the lake
    set(12, 17, ICE); set(13, 17, ICE); set(14, 17, ICE);
    set(12, 18, ICE); set(13, 18, ICE); set(14, 18, ICE);
    deco(13, 17, CRYSTAL); deco(13, 18, CRYSTAL);

    // Path connects to the lake's east shore
    for (let r = 18; r <= 21; r++) {
        set(15, r, ICE_PATH); set(16, r, ICE_PATH); set(17, r, ICE_PATH);
    }

    // ════════════════════════════════════════════════════════════════
    //  CRYSTAL CAVE — northeast, 10×8, enclosed with ICE_WALL
    // ════════════════════════════════════════════════════════════════
    // Outer walls: cols 44-53, rows 3-10
    fillRect(44, 3, 53, 10, ICE_WALL, true);
    // Interior: cols 45-52, rows 4-9 → ICE floor
    fillRect(45, 4, 52, 9, ICE);

    // Doorway entrance: cols 47-49 at row 10 (south wall)
    set(47, 10, ICE_PATH); set(48, 10, ICE_PATH); set(49, 10, ICE_PATH);
    collision[index(47, 10)] = 0; collision[index(48, 10)] = 0; collision[index(49, 10)] = 0;

    // Path from doorway down to main east-west path
    for (let r = 10; r <= 20; r++) {
        set(47, r, ICE_PATH); set(48, r, ICE_PATH); set(49, r, ICE_PATH);
    }

    // Crystal decorations inside the cave
    deco(46, 5, CRYSTAL); deco(49, 5, CRYSTAL); deco(52, 5, CRYSTAL);
    deco(45, 7, CRYSTAL); deco(48, 7, CRYSTAL); deco(51, 7, CRYSTAL);
    deco(46, 9, CRYSTAL); deco(50, 9, CRYSTAL); deco(52, 9, CRYSTAL);
    deco(47, 6, CRYSTAL); deco(50, 8, CRYSTAL);

    // Deep ice accent inside cave
    set(47, 6, DEEP_ICE); set(48, 6, DEEP_ICE); set(49, 6, DEEP_ICE);
    set(47, 7, DEEP_ICE); set(48, 7, DEEP_ICE); set(49, 7, DEEP_ICE);

    // ════════════════════════════════════════════════════════════════
    //  SNOWY CLEARING — southwest, 12×10, open SNOW area
    // ════════════════════════════════════════════════════════════════
    fillRect(3, 30, 14, 39, SNOW);

    // Scattered crystal decorations
    deco(5, 32, CRYSTAL); deco(8, 31, CRYSTAL); deco(11, 33, CRYSTAL);
    deco(4, 35, CRYSTAL); deco(7, 36, CRYSTAL); deco(10, 38, CRYSTAL);
    deco(6, 34, CRYSTAL); deco(12, 35, CRYSTAL); deco(9, 39, CRYSTAL);
    deco(3, 38, CRYSTAL); deco(13, 31, CRYSTAL);

    // A small frozen pond in the clearing
    set(7, 34, DEEP_ICE); set(8, 34, DEEP_ICE); set(9, 34, DEEP_ICE);
    set(7, 35, DEEP_ICE); set(8, 35, DEEP_ICE); set(9, 35, DEEP_ICE);

    // ════════════════════════════════════════════════════════════════
    //  RUINS — scattered ICE_WALL obstacle blocks
    // ════════════════════════════════════════════════════════════════
    // Ruin 1: 2×2 block near center
    fillRect(25, 14, 26, 15, ICE_WALL, true);

    // Ruin 2: 3×2 block southeast
    fillRect(35, 30, 37, 31, ICE_WALL, true);

    // Ruin 3: 2×2 near frozen lake
    fillRect(23, 25, 24, 26, ICE_WALL, true);

    // Ruin 4: 3×2 block mid-north
    fillRect(28, 5, 30, 6, ICE_WALL, true);

    // Ruin 5: 2×2 east of center
    fillRect(38, 15, 39, 16, ICE_WALL, true);

    // Ruin 6: 3×2 south-center
    fillRect(22, 35, 24, 36, ICE_WALL, true);

    // Ruin 7: 2×2 near east exit
    fillRect(52, 27, 53, 28, ICE_WALL, true);

    // Ruin 8: 3×2 northwest area
    fillRect(6, 5, 8, 6, ICE_WALL, true);

    // Ruin 9: 2×2 mid-south
    fillRect(40, 35, 41, 36, ICE_WALL, true);

    // Crystal accents on ruins
    deco(25, 14, CRYSTAL); deco(37, 30, CRYSTAL);
    deco(28, 5, CRYSTAL); deco(52, 27, CRYSTAL);

    // ════════════════════════════════════════════════════════════════
    //  DEAD-END AREAS with crystal rewards
    // ════════════════════════════════════════════════════════════════

    // Dead-end 1: Northwest alcove
    fillRect(3, 3, 4, 8, ICE_WALL, true);
    fillRect(3, 3, 10, 3, ICE_WALL, true);
    fillRect(10, 3, 10, 6, ICE_WALL, true);
    fillRect(5, 4, 9, 7, ICE);
    set(5, 8, ICE_PATH); set(6, 8, ICE_PATH); set(7, 8, ICE_PATH);
    deco(6, 5, CRYSTAL); deco(8, 5, CRYSTAL); deco(7, 6, CRYSTAL);
    deco(5, 7, CRYSTAL); deco(9, 7, CRYSTAL);
    set(7, 5, DEEP_ICE); set(7, 6, DEEP_ICE);

    // Path connecting NW alcove to main path
    for (let r = 8; r <= 10; r++) {
        set(5, r, ICE_PATH); set(6, r, ICE_PATH); set(7, r, ICE_PATH);
    }
    for (let c = 7; c <= 15; c++) {
        set(c, 10, ICE_PATH); set(c, 9, ICE_PATH);
    }

    // Dead-end 2: Southeast nook
    fillRect(48, 33, 55, 33, ICE_WALL, true);
    fillRect(48, 33, 48, 39, ICE_WALL, true);
    fillRect(55, 33, 55, 39, ICE_WALL, true);
    fillRect(49, 34, 54, 38, ICE);
    set(50, 33, ICE_PATH); set(51, 33, ICE_PATH); set(52, 33, ICE_PATH);
    collision[index(50, 33)] = 0; collision[index(51, 33)] = 0; collision[index(52, 33)] = 0;
    deco(50, 35, CRYSTAL); deco(53, 35, CRYSTAL);
    deco(51, 37, CRYSTAL); deco(54, 37, CRYSTAL);
    deco(52, 36, CRYSTAL);
    set(51, 36, DEEP_ICE); set(52, 36, DEEP_ICE);

    // Path to SE nook from east path
    for (let r = 26; r <= 33; r++) {
        set(50, r, ICE_PATH); set(51, r, ICE_PATH); set(52, r, ICE_PATH);
    }

    // Dead-end 3: Small cave pocket mid-west
    fillRect(3, 14, 3, 18, ICE_WALL, true);
    fillRect(3, 14, 6, 14, ICE_WALL, true);
    fillRect(3, 18, 6, 18, ICE_WALL, true);
    fillRect(4, 15, 5, 17, ICE);
    deco(4, 16, CRYSTAL); deco(5, 15, CRYSTAL); deco(5, 17, CRYSTAL);
    set(6, 16, ICE_PATH); set(6, 17, ICE_PATH);
    for (let c = 6; c <= 15; c++) {
        set(c, 16, ICE_PATH); set(c, 17, ICE_PATH);
    }

    // ════════════════════════════════════════════════════════════════
    //  SCATTERED DEEP ICE PATCHES (cosmetic variety)
    // ════════════════════════════════════════════════════════════════
    fillRect(32, 12, 34, 13, DEEP_ICE);
    fillRect(25, 38, 27, 39, DEEP_ICE);
    fillRect(45, 28, 47, 29, DEEP_ICE);
    fillRect(10, 27, 11, 28, DEEP_ICE);
    fillRect(38, 38, 39, 40, DEEP_ICE);
    fillRect(55, 14, 56, 16, DEEP_ICE);

    // ════════════════════════════════════════════════════════════════
    //  SCATTERED SMALL SNOW PATCHES (visual variety on ICE areas)
    // ════════════════════════════════════════════════════════════════
    fillRect(28, 17, 30, 18, SNOW);
    fillRect(20, 6, 22, 7, SNOW);
    fillRect(40, 10, 42, 11, SNOW);
    fillRect(33, 25, 35, 26, SNOW);
    fillRect(18, 34, 20, 35, SNOW);
    fillRect(50, 15, 52, 16, SNOW);
    fillRect(3, 25, 4, 26, SNOW);
    fillRect(44, 38, 46, 39, SNOW);

    // ════════════════════════════════════════════════════════════════
    //  ADDITIONAL SCATTERED CRYSTALS & ICE VARIATION
    // ════════════════════════════════════════════════════════════════
    for (let r = 3; r < H - 3; r++) {
        for (let c = 3; c < W - 3; c++) {
            const g = ground[index(c, r)];
            const isPath = g === ICE_PATH;
            const isSolid = collision[index(c, r)] === 1;
            if (isSolid || isPath) continue;
            // Sparse crystal decorations
            if ((c * 7 + r * 13) % 47 === 0 && decoration[index(c, r)] === 0) {
                deco(c, r, CRYSTAL);
            }
        }
    }

    // ── Final pass: ensure exits have no collision ─────────────────
    for (let c = 28; c <= 32; c++) {
        collision[index(c, H - 2)] = 0;
        collision[index(c, H - 1)] = 0;
    }
    for (let r = 20; r <= 23; r++) {
        collision[index(W - 2, r)] = 0;
        collision[index(W - 1, r)] = 0;
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
