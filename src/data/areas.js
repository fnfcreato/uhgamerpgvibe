export const AREA_DEFS = {
    town_of_robloxia: {
        id: 'town_of_robloxia',
        name: 'Town of Robloxia',
        mapFile: 'testMap',
        bgm: 'town',
        enemySpawns: [
            { spawnId: 'town_slime_1', enemyDefId: 'slime', x: 280, y: 200 },
            { spawnId: 'town_skel_1', enemyDefId: 'skeleton', x: 500, y: 280 },
            { spawnId: 'town_slime_2', enemyDefId: 'slime', x: 200, y: 450 },
        ],
        npcSpawns: [
            { npcDefId: 'elder', x: 400, y: 120 },
            { npcDefId: 'guard', x: 150, y: 200 },
            { npcDefId: 'blacksmith', x: 616, y: 200 },
        ],
        exits: [
            { x: 784, y: 304, w: 16, h: 32, targetAreaId: 'corrupted_zone_1', targetSpawnX: 40, targetSpawnY: 272 },
        ],
        gateConditions: [],
        corruptionProfile: null,
        sanctuaries: [],
        clearQuestId: null,
    },
    corrupted_zone_1: {
        id: 'corrupted_zone_1',
        name: 'Corrupted Zone I',
        mapFile: 'corruptedZone1',
        bgm: 'town',
        enemySpawns: [
            { spawnId: 'z1_wisp_1', enemyDefId: 'shadow_wisp', x: 200, y: 200 },
            { spawnId: 'z1_wisp_2', enemyDefId: 'shadow_wisp', x: 400, y: 350 },
            { spawnId: 'z1_knight_1', enemyDefId: 'corrupted_knight', x: 350, y: 250 },
            { spawnId: 'z1_knight_2', enemyDefId: 'corrupted_knight', x: 550, y: 180 },
        ],
        npcSpawns: [
            { npcDefId: 'herbalist', x: 136, y: 136 },
            { npcDefId: 'scavenger', x: 288, y: 408 },
        ],
        exits: [
            { x: 0, y: 256, w: 16, h: 32, targetAreaId: 'town_of_robloxia', targetSpawnX: 760, targetSpawnY: 312 },
            { x: 704, y: 256, w: 16, h: 32, targetAreaId: 'corrupted_zone_2', targetSpawnX: 40, targetSpawnY: 272 },
        ],
        gateConditions: [],
        corruptionProfile: { level: 1, tint: 'rgba(80, 0, 80, 0.08)', particleDensity: 0.3 },
        sanctuaries: [
            { x: 64, y: 80, w: 96, h: 80 },
            { x: 240, y: 368, w: 112, h: 96 },
        ],
        clearQuestId: 'zone_1_clear',
    },
    corrupted_zone_2: {
        id: 'corrupted_zone_2',
        name: 'Corrupted Zone II',
        mapFile: 'corruptedZone2',
        bgm: 'town',
        enemySpawns: [
            { spawnId: 'z2_crawler_1', enemyDefId: 'void_crawler', x: 200, y: 200 },
            { spawnId: 'z2_crawler_2', enemyDefId: 'void_crawler', x: 500, y: 300 },
            { spawnId: 'z2_mage_1', enemyDefId: 'dark_mage', x: 350, y: 150 },
            { spawnId: 'z2_mage_2', enemyDefId: 'dark_mage', x: 400, y: 400 },
        ],
        npcSpawns: [
            { npcDefId: 'pilgrim', x: 120, y: 456 },
            { npcDefId: 'watcher', x: 88, y: 472 },
        ],
        exits: [
            { x: 0, y: 256, w: 16, h: 32, targetAreaId: 'corrupted_zone_1', targetSpawnX: 680, targetSpawnY: 272 },
            { x: 704, y: 256, w: 16, h: 32, targetAreaId: 'corrupted_zone_3', targetSpawnX: 40, targetSpawnY: 312 },
        ],
        gateConditions: [],
        corruptionProfile: { level: 2, tint: 'rgba(80, 0, 80, 0.15)', particleDensity: 0.6 },
        sanctuaries: [
            { x: 64, y: 432, w: 112, h: 80 },
        ],
        clearQuestId: 'zone_2_clear',
    },
    corrupted_zone_3: {
        id: 'corrupted_zone_3',
        name: 'Corrupted Zone III',
        mapFile: 'corruptedZone3',
        bgm: 'town',
        enemySpawns: [
            { spawnId: 'z3_beast_1', enemyDefId: 'corruption_beast', x: 250, y: 250 },
            { spawnId: 'z3_beast_2', enemyDefId: 'corruption_beast', x: 550, y: 400 },
            { spawnId: 'z3_shade_1', enemyDefId: 'nightmare_shade', x: 400, y: 180 },
            { spawnId: 'z3_shade_2', enemyDefId: 'nightmare_shade', x: 350, y: 450 },
        ],
        npcSpawns: [
            { npcDefId: 'sentinel', x: 144, y: 152 },
            { npcDefId: 'keeper', x: 112, y: 128 },
        ],
        exits: [
            { x: 0, y: 304, w: 16, h: 32, targetAreaId: 'corrupted_zone_2', targetSpawnX: 680, targetSpawnY: 272 },
            { x: 784, y: 304, w: 16, h: 32, targetAreaId: 'final_arena', targetSpawnX: 240, targetSpawnY: 320 },
        ],
        gateConditions: [],
        corruptionProfile: { level: 3, tint: 'rgba(100, 0, 60, 0.2)', particleDensity: 1.0 },
        sanctuaries: [
            { x: 80, y: 96, w: 112, h: 112 },
        ],
        clearQuestId: 'zone_3_clear',
    },
    final_arena: {
        id: 'final_arena',
        name: 'Final Arena',
        mapFile: 'finalArena',
        bgm: 'town',
        enemySpawns: [
            { spawnId: 'final_beast_1', enemyDefId: 'corruption_beast', x: 190, y: 150 },
            { spawnId: 'final_shade_1', enemyDefId: 'nightmare_shade', x: 280, y: 150 },
        ],
        npcSpawns: [],
        exits: [
            { x: 224, y: 384, w: 32, h: 16, targetAreaId: 'corrupted_zone_3', targetSpawnX: 760, targetSpawnY: 312 },
        ],
        gateConditions: [],
        corruptionProfile: { level: 3, tint: 'rgba(120, 0, 40, 0.25)', particleDensity: 1.5 },
        sanctuaries: [],
        clearQuestId: null,
    },
};
