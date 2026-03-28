import { QUEST_DEFS } from '../data/quests.js';
import { AREA_DEFS } from '../data/areas.js';
import { SWORD_DEFS } from '../data/swords.js';
import { SHIELD_DEFS } from '../data/shields.js';
import { CONSUMABLE_DEFS } from '../data/consumables.js';

function getRewardLabel(reward) {
    if (reward.itemType === 'sword') {
        return SWORD_DEFS[reward.defId]?.name || reward.defId.replace(/_/g, ' ');
    }
    if (reward.itemType === 'shield') {
        return SHIELD_DEFS[reward.defId]?.name || reward.defId.replace(/_/g, ' ');
    }
    if (reward.itemType === 'consumable') {
        return CONSUMABLE_DEFS[reward.defId]?.name || reward.defId.replace(/_/g, ' ');
    }
    return reward.defId.replace(/_/g, ' ');
}

export class QuestManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.questState = gameState.quest;
    }

    isFlagSet(key) {
        return this.questState.flags.has(key);
    }

    getFlagValue(key) {
        return this.questState.flags.get(key);
    }

    setFlag(key, value) {
        this.questState.flags.set(key, value);
    }

    isQuestComplete(questId) {
        return this.questState.completedQuests.has(questId);
    }

    completeQuest(questId, inventoryManager = null) {
        if (this.questState.completedQuests.has(questId)) return [];

        this.questState.completedQuests.add(questId);

        const def = QUEST_DEFS[questId];
        if (!def || !def.rewards) return [];

        const summary = [];
        for (const reward of def.rewards) {
            if (reward.type === 'flag') {
                this.setFlag(reward.key, reward.value);
            } else if (reward.type === 'gold') {
                this.gameState.player.gold += reward.amount;
                summary.push(`+${reward.amount}g`);
            } else if (reward.type === 'item' && inventoryManager) {
                const count = reward.count || 1;
                for (let i = 0; i < count; i++) {
                    const item = inventoryManager.addItem(reward.defId, reward.itemType);
                    if (item) {
                        summary.push(getRewardLabel(reward));
                    }
                }
            }
        }

        return summary;
    }

    isBossDefeated(bossId) {
        return this.questState.defeatedBosses.has(bossId);
    }

    markBossDefeated(bossId) {
        this.questState.defeatedBosses.add(bossId);
    }

    isEnemyDefeated(spawnId) {
        return this.questState.defeatedEnemySpawns.has(spawnId);
    }

    markEnemyDefeated(spawnId) {
        this.questState.defeatedEnemySpawns.add(spawnId);
    }

    checkRequirements(requirements) {
        if (!requirements || requirements.length === 0) return true;

        for (const req of requirements) {
            if (req.type === 'flag') {
                if (this.getFlagValue(req.key) !== req.value) return false;
            } else if (req.type === 'boss_defeated') {
                if (!this.isBossDefeated(req.key)) return false;
            } else if (req.type === 'quest_complete') {
                if (!this.isQuestComplete(req.key)) return false;
            }
        }

        return true;
    }

    canEnterArea(areaId) {
        const areaDef = AREA_DEFS[areaId];
        if (!areaDef) return false;
        if (!areaDef.gateConditions || areaDef.gateConditions.length === 0) return true;

        return this.checkRequirements(areaDef.gateConditions);
    }
}
