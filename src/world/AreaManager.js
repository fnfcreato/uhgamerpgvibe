import { AREA_DEFS } from '../data/areas.js';
import { ENEMY_DEFS } from '../data/enemies.js';
import { NPC_DEFS } from '../data/npcs.js';
import { TEST_MAP } from '../data/testMap.js';
import { CORRUPTED_ZONE_1_MAP } from '../data/maps/corruptedZone1.js';
import { CORRUPTED_ZONE_2_MAP } from '../data/maps/corruptedZone2.js';
import { CORRUPTED_ZONE_3_MAP } from '../data/maps/corruptedZone3.js';
import { FINAL_ARENA_MAP } from '../data/maps/finalArena.js';
import { Enemy } from './Enemy.js';
import { NPC } from './NPC.js';

const MAP_DATA = {
    testMap: TEST_MAP,
    corruptedZone1: CORRUPTED_ZONE_1_MAP,
    corruptedZone2: CORRUPTED_ZONE_2_MAP,
    corruptedZone3: CORRUPTED_ZONE_3_MAP,
    finalArena: FINAL_ARENA_MAP,
};

export class AreaManager {
    constructor(context) {
        this.context = context;
    }

    loadArea(areaId) {
        const areaDef = AREA_DEFS[areaId];
        if (!areaDef) return null;

        const mapData = MAP_DATA[areaDef.mapFile];
        if (!mapData) return null;

        const questState = this.context.state.quest;

        const enemies = [];
        for (const spawn of areaDef.enemySpawns) {
            if (questState.defeatedEnemySpawns.has(spawn.spawnId)) continue;

            const enemyDef = ENEMY_DEFS[spawn.enemyDefId];
            if (!enemyDef) continue;

            enemies.push(new Enemy(spawn.x, spawn.y, enemyDef, spawn.spawnId));
        }

        const npcs = [];
        for (const spawn of areaDef.npcSpawns) {
            const npcDef = NPC_DEFS[spawn.npcDefId];
            if (npcDef) npcs.push(new NPC(spawn.x, spawn.y, npcDef));
        }

        this.context.state.area.currentAreaId = areaId;
        this.context.state.area.visitedAreas.add(areaId);

        return {
            mapData,
            enemies,
            npcs,
            bgmId: areaDef.bgm,
            playerSpawn: areaDef.playerSpawn || null,
        };
    }

    canEnterArea(areaId) {
        return this.context.quests.canEnterArea(areaId);
    }
}
