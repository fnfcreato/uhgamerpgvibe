export class PlayerState {
    constructor() {
        this.hp = 100;
        this.maxHp = 100;
        this.soulIntegrity = 100;
        this.gold = 120;
        this.position = { x: 160, y: 90 };
        this.equippedSwords = [null, null];
        this.equippedShield = null;
    }
}

export class InventoryState {
    constructor() {
        this.items = [];
        this.equippedSwords = [null, null];
        this.equippedShield = null;
        this.capacity = 24;
    }
}

export class QuestState {
    constructor() {
        this.flags = new Map();
        this.completedQuests = new Set();
        this.defeatedBosses = new Set();
        this.openedChests = new Set();
        this.defeatedEnemySpawns = new Set();
    }
}

export class AreaState {
    constructor() {
        this.currentAreaId = null;
        this.playerSpawnPoint = { x: 0, y: 0 };
        this.visitedAreas = new Set();
    }
}

export class SettingsState {
    constructor() {
        this.bgmVolume = 0.7;
        this.sfxVolume = 1.0;
        this.saveVersion = 2;
    }
}

export class GameState {
    constructor() {
        this.player = new PlayerState();
        this.inventory = new InventoryState();
        this.quest = new QuestState();
        this.area = new AreaState();
        this.settings = new SettingsState();
    }
}
