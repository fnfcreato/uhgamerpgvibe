export const QUEST_DEFS = {
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
