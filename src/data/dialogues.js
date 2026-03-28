export const DIALOGUES = {
    elder_intro: {
        id: 'elder_intro',
        nodes: [
            { id: 'start', speaker: 'Elder', text: 'Welcome, young warrior. The eastern roads are open, but the corruption beyond them is growing stronger.', nextNode: 'explain' },
            { id: 'explain', speaker: 'Elder', text: 'Look for the soul sanctuaries hidden in the corrupted lands. They will steady you when the world starts pulling you apart.', nextNode: 'quest' },
            { id: 'quest', speaker: 'Elder', text: 'Will you carry the town through this?', choices: [
                { text: 'Yes. I will fight.', nextNode: 'accept', setFlag: { key: 'elder_quest_accepted', value: true } },
                { text: 'Tell me more.', nextNode: 'more_info' },
            ]},
            { id: 'accept', speaker: 'Elder', text: 'Then move east, rest in the sanctuaries when your soul falters, and return only after the corruption yields.' },
            { id: 'more_info', speaker: 'Elder', text: 'The farther you go, the faster the corruption strikes. Safe circles of grass still remain, but they are rare.', nextNode: 'quest' },
        ],
    },
    guard_info: {
        id: 'guard_info',
        nodes: [
            { id: 'start', speaker: 'Guard', text: 'The elder hall door is clear now. If you head east, follow the road and do not drift into the dead ground.' },
        ],
    },
    blacksmith_shop: {
        id: 'blacksmith_shop',
        nodes: [
            { id: 'start', speaker: 'Blacksmith', text: 'Steel costs gold, and broken shields cost more. Open the forge if you want to buy gear or repair what you have.' },
        ],
    },
    herbalist_cache: {
        id: 'herbalist_cache',
        nodes: [
            { id: 'start', speaker: 'Herbalist', text: 'I keep tonics for fighters who make it this far. Buy some before you go deeper, because the next sanctuary is never guaranteed.' },
        ],
    },
    pilgrim_warning: {
        id: 'pilgrim_warning',
        nodes: [
            { id: 'start', speaker: 'Pilgrim', text: 'Zone II eats the careless. Clear the monsters one pocket at a time and do not waste your healing on scratches.' },
        ],
    },
    sentinel_laststand: {
        id: 'sentinel_laststand',
        nodes: [
            { id: 'start', speaker: 'Sentinel', text: 'This is the last calm ground before the arena. If you still have phials, save them for the end and keep your shield repaired.' },
        ],
    },
    scavenger_rumors: {
        id: 'scavenger_rumors',
        nodes: [
            { id: 'start', speaker: 'Scavenger', text: 'The corruption does not just swallow people. It leaves their gear behind. Check every quiet corner after a fight and you may find a tonic or a blade.' },
        ],
    },
    watcher_warning: {
        id: 'watcher_warning',
        nodes: [
            { id: 'start', speaker: 'Watcher', text: 'Stay inside the sanctuary light if your soul starts shaking. If you push while cracked, even weak monsters will finish you.' },
        ],
    },
    refuge_keeper: {
        id: 'refuge_keeper',
        nodes: [
            { id: 'start', speaker: 'Keeper', text: 'I mark cleared routes. Once a whole zone is pacified, the town sends proper payment instead of just praise.' },
        ],
    },
};
