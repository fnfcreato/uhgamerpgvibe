import { ARMOR_DEFS } from '../data/armors.js';

const SAVE_KEY = 'sword_of_stability_save';

function normalizeGoldValue(value) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return Math.max(0, Math.floor(value));
    }
    if (typeof value === 'string') {
        const match = value.match(/\d+/);
        return match ? Number.parseInt(match[0], 10) : 0;
    }
    return 0;
}

export class SaveManager {
    constructor(gameState) {
        this.gameState = gameState;
    }

    _serialize() {
        const { player, inventory, quest, area, settings } = this.gameState;
        return {
            player: {
                hp: player.hp,
                baseMaxHp: player.baseMaxHp,
                maxHp: player.maxHp,
                soulIntegrity: player.soulIntegrity,
                gold: player.gold,
                position: { x: player.position.x, y: player.position.y },
                equippedSwords: player.equippedSwords.map((item) => item?.instanceId || null),
                equippedShield: player.equippedShield?.instanceId || null,
                equippedArmor: player.equippedArmor?.instanceId || null,
                statusEffects: (player.statusEffects || []).map((effect) => ({ ...effect })),
            },
            inventory: {
                items: inventory.items.map((item) => ({ ...item })),
                equippedSwords: inventory.equippedSwords.map((item) => item?.instanceId || null),
                equippedShield: inventory.equippedShield?.instanceId || null,
                equippedArmor: inventory.equippedArmor?.instanceId || null,
                capacity: inventory.capacity,
            },
            quest: {
                flags: Array.from(quest.flags.entries()),
                completedQuests: Array.from(quest.completedQuests),
                defeatedBosses: Array.from(quest.defeatedBosses),
                openedChests: Array.from(quest.openedChests),
                defeatedEnemySpawns: Array.from(quest.defeatedEnemySpawns),
            },
            area: {
                currentAreaId: area.currentAreaId,
                playerSpawnPoint: { ...area.playerSpawnPoint },
                visitedAreas: Array.from(area.visitedAreas),
            },
            settings: {
                bgmVolume: settings.bgmVolume,
                sfxVolume: settings.sfxVolume,
                saveVersion: settings.saveVersion,
            },
        };
    }

    save() {
        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify(this._serialize()));
            return true;
        } catch {
            return false;
        }
    }

    load() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (!raw) {
                return false;
            }

            const data = JSON.parse(raw);
            this._apply(data);
            return true;
        } catch {
            return false;
        }
    }

    _apply(data) {
        const { player, inventory, quest, area, settings } = this.gameState;
        const savedInventory = data.inventory || { items: [], equippedSwords: [null, null], equippedShield: null, equippedArmor: null, capacity: 24 };
        const items = (savedInventory.items || []).map((item) => ({ ...item }));
        const itemsById = new Map(items.map((item) => [item.instanceId, item]));

        inventory.items = items;
        inventory.capacity = savedInventory.capacity || 24;
        inventory.equippedSwords = (savedInventory.equippedSwords || [null, null]).map((id) => itemsById.get(id) || null);
        inventory.equippedShield = itemsById.get(savedInventory.equippedShield) || null;
        inventory.equippedArmor = itemsById.get(savedInventory.equippedArmor) || null;

        player.baseMaxHp = data.player?.baseMaxHp ?? player.baseMaxHp ?? 100;
        player.hp = data.player?.hp ?? player.hp;
        player.soulIntegrity = data.player?.soulIntegrity ?? player.soulIntegrity;
        player.gold = normalizeGoldValue(data.player?.gold ?? player.gold);
        player.position.x = data.player?.position?.x ?? player.position.x;
        player.position.y = data.player?.position?.y ?? player.position.y;
        player.statusEffects = (data.player?.statusEffects || []).map((effect) => ({ ...effect }));
        player.equippedSwords = inventory.equippedSwords.slice(0, 2);
        while (player.equippedSwords.length < 2) {
            player.equippedSwords.push(null);
        }
        player.equippedShield = inventory.equippedShield;
        player.equippedArmor = inventory.equippedArmor;

        const armorDef = player.equippedArmor ? ARMOR_DEFS[player.equippedArmor.defId] : null;
        player.maxHp = player.baseMaxHp + (armorDef?.maxHpBonus || 0);
        player.hp = Math.min(player.hp, player.maxHp);

        quest.flags = new Map(data.quest?.flags || []);
        quest.completedQuests = new Set(data.quest?.completedQuests || []);
        quest.defeatedBosses = new Set(data.quest?.defeatedBosses || []);
        quest.openedChests = new Set(data.quest?.openedChests || []);
        quest.defeatedEnemySpawns = new Set(data.quest?.defeatedEnemySpawns || []);

        area.currentAreaId = data.area?.currentAreaId ?? area.currentAreaId;
        area.playerSpawnPoint = {
            x: data.area?.playerSpawnPoint?.x ?? area.playerSpawnPoint.x,
            y: data.area?.playerSpawnPoint?.y ?? area.playerSpawnPoint.y,
        };
        area.visitedAreas = new Set(data.area?.visitedAreas || []);

        settings.bgmVolume = data.settings?.bgmVolume ?? settings.bgmVolume;
        settings.sfxVolume = data.settings?.sfxVolume ?? settings.sfxVolume;
        settings.saveVersion = data.settings?.saveVersion ?? settings.saveVersion;
    }
}
