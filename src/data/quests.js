export const QUEST_DEFS = {
    town_clear: {
        id: 'town_clear',
        name: 'Town Secured',
        description: 'Drive the threats out of Town of Robloxia.',
        rewards: [
            { type: 'gold', amount: 45 },
            { type: 'item', itemType: 'consumable', defId: 'field_tonic', count: 3 },
            { type: 'flag', key: 'town_cleared', value: true },
        ],
    },
    frozen_pass_clear: {
        id: 'frozen_pass_clear',
        name: 'Frozen Pass Cleared',
        description: 'Make the pass safe enough to travel through.',
        rewards: [
            { type: 'gold', amount: 85 },
            { type: 'item', itemType: 'consumable', defId: 'field_tonic', count: 3 },
            { type: 'flag', key: 'frozen_pass_cleared', value: true },
        ],
    },
    glacier_cavern_clear: {
        id: 'glacier_cavern_clear',
        name: 'Glacier Cavern Cleared',
        description: 'Survive the cavern and break its frozen hold.',
        rewards: [
            { type: 'gold', amount: 120 },
            { type: 'item', itemType: 'consumable', defId: 'crimson_phial', count: 2 },
            { type: 'flag', key: 'glacier_cavern_cleared', value: true },
        ],
    },
    main_quest_1: {
        id: 'main_quest_1',
        name: 'The Corruption Begins',
        description: 'Investigate the corrupted zone east of town.',
        requirements: [{ type: 'flag', key: 'elder_quest_accepted', value: true }],
        rewards: [{ type: 'flag', key: 'zone_1_unlocked', value: true }],
        gatesArea: 'corrupted_zone_1',
    },
    main_quest_2: {
        id: 'main_quest_2',
        name: 'Deeper Corruption',
        description: 'Push further into the corrupted zones.',
        requirements: [{ type: 'boss_defeated', key: 'boss_1x1' }],
        rewards: [{ type: 'flag', key: 'zone_2_unlocked', value: true }],
        gatesArea: 'corrupted_zone_2',
    },
    zone_1_clear: {
        id: 'zone_1_clear',
        name: 'Zone I Cleansed',
        description: 'Drive the first corrupted route clear.',
        rewards: [
            { type: 'gold', amount: 70 },
            { type: 'item', itemType: 'consumable', defId: 'field_tonic', count: 2 },
            { type: 'flag', key: 'zone_1_cleared', value: true },
        ],
    },
    zone_2_clear: {
        id: 'zone_2_clear',
        name: 'Zone II Cleansed',
        description: 'Stabilize the middle corruption front.',
        rewards: [
            { type: 'gold', amount: 110 },
            { type: 'item', itemType: 'consumable', defId: 'crimson_phial', count: 1 },
            { type: 'flag', key: 'zone_2_cleared', value: true },
        ],
    },
    zone_3_clear: {
        id: 'zone_3_clear',
        name: 'Zone III Cleansed',
        description: 'Break through the deepest corrupted maze.',
        rewards: [
            { type: 'gold', amount: 160 },
            { type: 'item', itemType: 'consumable', defId: 'crimson_phial', count: 2 },
            { type: 'flag', key: 'zone_3_cleared', value: true },
        ],
    },
};
