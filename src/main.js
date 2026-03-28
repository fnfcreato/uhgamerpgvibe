import { Game } from './core/Game.js';
import { ExplorationScene } from './world/ExplorationScene.js';
import { HUD } from './ui/HUD.js';

const MAP_BGM_ID = 'town';
const MAP_BGM_SRC = 'assets/audio/bgm/PixelDreamsOrangeOrchestralTimpani071544.mp3';

function showFatalError(error) {
    const existing = document.getElementById('fatalErrorOverlay');
    const overlay = existing || document.createElement('pre');
    overlay.id = 'fatalErrorOverlay';
    overlay.textContent = typeof error === 'string' ? error : error?.stack || error?.message || String(error);
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.zIndex = '999';
    overlay.style.margin = '0';
    overlay.style.padding = '12px';
    overlay.style.whiteSpace = 'pre-wrap';
    overlay.style.overflow = 'auto';
    overlay.style.background = 'rgba(8, 8, 12, 0.96)';
    overlay.style.color = '#ff9f7a';
    overlay.style.font = '12px monospace';
    overlay.style.pointerEvents = 'auto';

    if (!existing) {
        document.body.appendChild(overlay);
    }
}

window.addEventListener('error', (event) => {
    showFatalError(event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
    showFatalError(event.reason);
});

try {
    const canvas = document.getElementById('gameCanvas');
    const game = new Game(canvas);
    game.context.audio.registerBGM(MAP_BGM_ID, MAP_BGM_SRC);

    const rustyBlade = game.context.inventory.addItem('rusty_blade', 'sword');
    const swiftEdge = game.context.inventory.addItem('swift_edge', 'sword');
    const woodenGuard = game.context.inventory.addItem('wooden_guard', 'shield');
    game.context.inventory.addItem('field_tonic', 'consumable');
    game.context.inventory.addItem('field_tonic', 'consumable');

    if (rustyBlade) game.context.inventory.equipSword(rustyBlade.instanceId, 0);
    if (swiftEdge) game.context.inventory.equipSword(swiftEdge.instanceId, 1);
    if (woodenGuard) game.context.inventory.equipShield(woodenGuard.instanceId);

    const exploration = new ExplorationScene(game.context);
    exploration.loadFromAreaManager('town_of_robloxia');

    game.context.scenes.push(exploration);
    game.context.scenes.push(new HUD(game.context));
    game.start();
} catch (error) {
    showFatalError(error);
}
