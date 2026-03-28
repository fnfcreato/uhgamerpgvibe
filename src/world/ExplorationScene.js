import { SceneType } from '../core/SceneManager.js';
import { Player } from './Player.js';
import { TileMap } from './TileMap.js';
import { TileRenderer } from '../rendering/TileRenderer.js';
import { BattleScene } from '../battle/BattleScene.js';
import { BattleTransition } from '../battle/BattleTransition.js';
import { CANVAS } from '../data/constants.js';
import { MenuUI } from '../ui/MenuUI.js';
import { ShopUI } from '../ui/ShopUI.js';
import { DialogueSystem } from '../systems/DialogueSystem.js';
import { AreaManager } from './AreaManager.js';
import { AREA_DEFS } from '../data/areas.js';
import { PixelText } from '../rendering/PixelText.js';
import { SWORD_DEFS } from '../data/swords.js';
import { SHIELD_DEFS } from '../data/shields.js';
import { CONSUMABLE_DEFS } from '../data/consumables.js';

export class ExplorationScene {
    constructor(context) {
        this.type = SceneType.FULLSCREEN;
        this.context = context;

        this.player = null;
        this.tileMap = null;
        this.tileRenderer = new TileRenderer();

        this.enemies = [];
        this.npcs = [];

        this._inBattle = false;
        this._bgmId = null;
        this._areaId = null;
        this._areaExits = [];
        this._corruptionProfile = null;
        this._message = '';
        this._messageTimer = 0;
        this._soulStage = 100;
        this._sanctuaryZones = [];
        this._inSanctuary = false;
    }

    onEnter() {
        this.context.input.setContext('exploration');
        this._playAreaBGM();
    }

    onExit() {
        if (this.context.audio.getCurrentBGMId() === this._bgmId) {
            this.context.audio.stopBGM();
        }
    }

    loadArea(mapData, playerX, playerY, options = {}) {
        this.tileMap = new TileMap(mapData);
        this.player = new Player(playerX, playerY);
        this.context.state.player.position = this.player.position;

        this.context.camera.x = playerX;
        this.context.camera.y = playerY;
        this.context.camera._targetX = playerX;
        this.context.camera._targetY = playerY;

        if (options.bgmId !== undefined) {
            this._bgmId = options.bgmId;
        }
        if (options.areaId !== undefined) {
            this._areaId = options.areaId;
        }

        this._areaExits = options.exits || [];
        this._corruptionProfile = options.corruptionProfile || null;
        this._sanctuaryZones = options.sanctuaries || [];
        this._inSanctuary = false;
        this.context.state.area.playerSpawnPoint = { x: playerX, y: playerY };
        this._soulStage = this._getSoulStage();

        if (this.context.scenes.currentScene() === this) {
            this._playAreaBGM();
        }
    }

    syncFromGameState() {
        const areaId = this.context.state.area.currentAreaId || 'town_of_robloxia';
        if (areaId !== this._areaId || !this.player || !this.tileMap) {
            this.loadFromAreaManager(areaId);
        }
        if (!this.player) {
            return;
        }

        this.player.position.x = this.context.state.player.position.x;
        this.player.position.y = this.context.state.player.position.y;
        this.context.camera.x = this.player.position.x;
        this.context.camera.y = this.player.position.y;
        this.context.camera._targetX = this.player.position.x;
        this.context.camera._targetY = this.player.position.y;
        this.player.setMovement(0, 0);
    }

    _playAreaBGM() {
        if (!this._bgmId) {
            return;
        }

        this.context.audio.playBGM(this._bgmId);
    }

    _showMessage(text) {
        this._message = text;
        this._messageTimer = 1.8;
    }

    _getSoulStage() {
        const soul = this.context.state.player.soulIntegrity;
        if (soul <= 20) return 20;
        if (soul <= 50) return 50;
        return 100;
    }

    _isInsideZone(zone, x, y) {
        return x >= zone.x && x < zone.x + zone.w && y >= zone.y && y < zone.y + zone.h;
    }

    _updateSoulIntegrity(dt) {
        const player = this.context.state.player;
        const px = this.player?.position.x || player.position.x;
        const py = this.player?.position.y || player.position.y;
        const inSanctuary = this._sanctuaryZones.some((zone) => this._isInsideZone(zone, px, py));
        const before = player.soulIntegrity;

        if (inSanctuary !== this._inSanctuary) {
            this._inSanctuary = inSanctuary;
            this._showMessage(inSanctuary ? 'Soul sanctuary found' : 'The corruption presses back in');
        }

        if (inSanctuary) {
            player.soulIntegrity = Math.min(100, player.soulIntegrity + ((4.4 + (this._corruptionProfile?.level || 0) * 0.5) * dt));
        } else if (this._corruptionProfile?.level) {
            const drain = 0.55 + this._corruptionProfile.level * 0.35;
            player.soulIntegrity = Math.max(0, player.soulIntegrity - (drain * dt));
        } else {
            player.soulIntegrity = Math.min(100, player.soulIntegrity + (1.2 * dt));
        }

        const nextStage = this._getSoulStage();
        if (nextStage !== this._soulStage) {
            if (!this._corruptionProfile && nextStage === 100 && before < 100) {
                this._showMessage('Soul restored by safe ground');
            } else if (nextStage === 50) {
                this._showMessage('Your soul feels unstable');
            } else if (nextStage === 20) {
                this._showMessage('Soul critical!');
            } else if (nextStage === 100 && before < 100) {
                this._showMessage('Your soul steadies again');
            }
            this._soulStage = nextStage;
        }
    }

    _getRewardLabel(defId, type) {
        if (type === 'sword') return SWORD_DEFS[defId]?.name || defId.replace(/_/g, ' ');
        if (type === 'shield') return SHIELD_DEFS[defId]?.name || defId.replace(/_/g, ' ');
        if (type === 'consumable') return CONSUMABLE_DEFS[defId]?.name || defId.replace(/_/g, ' ');
        return defId.replace(/_/g, ' ');
    }

    _maybeAwardAreaClearRewards(summaryLines) {
        const areaDef = AREA_DEFS[this._areaId];
        if (!areaDef?.clearQuestId) {
            return;
        }
        if (this.context.quests.isQuestComplete(areaDef.clearQuestId)) {
            return;
        }
        if (this.enemies.some((enemy) => enemy.active)) {
            return;
        }

        const rewards = this.context.quests.completeQuest(areaDef.clearQuestId, this.context.inventory);
        if (rewards.length === 0) {
            return;
        }

        summaryLines.push(`${areaDef.name} cleared`);
        for (const reward of rewards) {
            summaryLines.push(reward.startsWith('+') ? reward : `Reward ${reward}`);
        }
    }

    loadFromAreaManager(areaId) {
        const areaManager = new AreaManager(this.context);
        const result = areaManager.loadArea(areaId);
        if (!result) return false;

        const areaDef = AREA_DEFS[areaId];
        const spawnX = result.playerSpawn?.x || areaDef?.playerSpawn?.x || result.mapData.width * result.mapData.tileSize / 2;
        const spawnY = result.playerSpawn?.y || areaDef?.playerSpawn?.y || result.mapData.height * result.mapData.tileSize / 2;

        this.enemies = [];
        this.npcs = [];

        this.loadArea(result.mapData, spawnX, spawnY, {
            areaId,
            bgmId: result.bgmId,
            exits: areaDef.exits || [],
            corruptionProfile: areaDef.corruptionProfile || null,
            sanctuaries: areaDef.sanctuaries || [],
        });

        for (const enemy of result.enemies) this.addEnemy(enemy);
        for (const npc of result.npcs) this.addNPC(npc);

        this._showMessage(areaDef?.name || areaId);
        return true;
    }

    transitionToArea(areaId, spawnX, spawnY) {
        const areaManager = new AreaManager(this.context);
        if (!areaManager.canEnterArea(areaId)) {
            this._showMessage('That path is sealed for now');
            return false;
        }

        const result = areaManager.loadArea(areaId);
        if (!result) {
            this._showMessage('Area failed to load');
            return false;
        }

        const areaDef = AREA_DEFS[areaId];
        this.enemies = [];
        this.npcs = [];

        this.loadArea(result.mapData, spawnX, spawnY, {
            areaId,
            bgmId: result.bgmId,
            exits: areaDef.exits || [],
            corruptionProfile: areaDef.corruptionProfile || null,
            sanctuaries: areaDef.sanctuaries || [],
        });

        for (const enemy of result.enemies) this.addEnemy(enemy);
        for (const npc of result.npcs) this.addNPC(npc);

        this._playAreaBGM();
        this._showMessage(areaDef?.name || areaId);
        return true;
    }

    addEnemy(enemy) {
        this.enemies.push(enemy);
    }

    addNPC(npc) {
        this.npcs.push(npc);
    }

    handleInput(input) {
        if (!this.player || this._inBattle) return;

        if (input.isActionPressed('pause')) {
            this.context.scenes.push(new MenuUI(this.context, {
                returnContext: 'exploration',
                ownerScene: this,
                allowStateActions: true,
            }));
            return;
        }

        let mx = 0;
        let my = 0;
        if (input.isActionDown('moveLeft')) mx -= 1;
        if (input.isActionDown('moveRight')) mx += 1;
        if (input.isActionDown('moveUp')) my -= 1;
        if (input.isActionDown('moveDown')) my += 1;
        this.player.setMovement(mx, my);

        if (input.isActionPressed('interact')) {
            for (const npc of this.npcs) {
                if (!npc.active) continue;
                if (npc.isPlayerInRange(this.player.position)) {
                    if (npc.def.shopId) {
                        this.player.setMovement(0, 0);
                        this.context.scenes.push(new ShopUI(this.context, npc.def.shopId, { returnContext: 'exploration' }));
                    } else {
                        this._startDialogue(npc);
                    }
                    break;
                }
            }
        }
    }

    update(dt) {
        if (!this.player || !this.tileMap) return;

        this.player.update(dt, this.tileMap);

        for (const enemy of this.enemies) {
            if (!enemy.active) continue;
            enemy.update(dt, this.player.position, this.tileMap);
        }

        for (const npc of this.npcs) {
            if (!npc.active) continue;
            npc.update(dt, this.player.position);
        }

        this._updateSoulIntegrity(dt);

        if (!this._inBattle) {
            for (const enemy of this.enemies) {
                if (!enemy.active) continue;
                if (enemy.isPlayerInRange(this.player.position)) {
                    this._startBattle(enemy);
                    break;
                }
            }
        }

        for (const exit of this._areaExits) {
            const px = this.player.position.x;
            const py = this.player.position.y;
            if (px >= exit.x && px < exit.x + exit.w && py >= exit.y && py < exit.y + exit.h) {
                if (this.transitionToArea(exit.targetAreaId, exit.targetSpawnX, exit.targetSpawnY)) {
                    break;
                }
            }
        }

        this.context.camera.follow(this.player.position.x, this.player.position.y);

        const cam = this.context.camera;
        const halfW = CANVAS.INTERNAL_WIDTH / 2;
        const halfH = CANVAS.INTERNAL_HEIGHT / 2;
        const mapW = this.tileMap.pixelWidth;
        const mapH = this.tileMap.pixelHeight;

        cam._targetX = mapW > CANVAS.INTERNAL_WIDTH
            ? Math.max(halfW, Math.min(mapW - halfW, cam._targetX))
            : mapW / 2;
        cam._targetY = mapH > CANVAS.INTERNAL_HEIGHT
            ? Math.max(halfH, Math.min(mapH - halfH, cam._targetY))
            : mapH / 2;

        if (this._messageTimer > 0) {
            this._messageTimer -= dt;
        }
    }

    _startBattle(enemy) {
        this._inBattle = true;
        this.player.setMovement(0, 0);

        const areaDef = AREA_DEFS[this._areaId];
        const battleScene = new BattleScene(this.context, enemy.def, {
            battleBgmId: areaDef?.battleBgm || null,
            onVictory: () => {
                enemy.active = false;
                this.context.quests.markEnemyDefeated(enemy.spawnId);

                const summaryLines = [];
                if (enemy.def.goldDrop) {
                    this.context.state.player.gold += enemy.def.goldDrop;
                    summaryLines.push(`Gold +${enemy.def.goldDrop}`);
                }

                const soulGain = this._corruptionProfile ? 2 + this._corruptionProfile.level : 1;
                const soulBefore = this.context.state.player.soulIntegrity;
                this.context.state.player.soulIntegrity = Math.min(100, soulBefore + soulGain);
                if (this.context.state.player.soulIntegrity > soulBefore) {
                    summaryLines.push(`Soul +${Math.round(this.context.state.player.soulIntegrity - soulBefore)}`);
                    this._soulStage = this._getSoulStage();
                }

                let gotLoot = false;
                if (enemy.def.loot && Math.random() < enemy.def.loot.chance) {
                    const loot = enemy.def.loot;
                    const item = this.context.inventory.addItem(loot.defId, loot.type);
                    if (item) {
                        summaryLines.push(`Loot ${this._getRewardLabel(loot.defId, loot.type)}`);
                        gotLoot = true;
                    }
                }

                if (!gotLoot && this._corruptionProfile && Math.random() < 0.18) {
                    const tonic = this.context.inventory.addItem('field_tonic', 'consumable');
                    if (tonic) {
                        summaryLines.push('Found Field Tonic');
                    }
                }

                this._maybeAwardAreaClearRewards(summaryLines);

                if (summaryLines.length > 0) {
                    this.context.audio.playSFX('loot');
                    this._showMessage(summaryLines.join('  '));
                }

                this._inBattle = false;
                return {
                    title: 'Battle Rewards',
                    lines: summaryLines.length > 0 ? summaryLines : ['No rewards'],
                };
            },
            onDefeat: () => {
                this.context.state.player.hp = this.context.state.player.maxHp;
                this.context.state.player.soulIntegrity = Math.max(70, this.context.state.player.soulIntegrity);
                this.loadFromAreaManager('town_of_robloxia');
                this._showMessage('You recovered in town');
                this._inBattle = false;
            },
        });

        this.context.scenes.push(battleScene, new BattleTransition());
    }

    _startDialogue(npc) {
        this.player.setMovement(0, 0);

        const dialogue = new DialogueSystem(this.context, npc.dialogueId);
        this.context.scenes.push(dialogue);
    }

    render(ctx) {
        if (!this.tileMap) return;

        const camera = this.context.camera;
        this.tileRenderer.render(ctx, this.tileMap, camera);

        for (const enemy of this.enemies) {
            if (enemy.active) {
                enemy.render(ctx, camera);
            }
        }

        for (const npc of this.npcs) {
            if (npc.active) {
                npc.render(ctx, camera);
            }
        }

        this.player.render(ctx, camera);
        this.tileRenderer.renderForeground(ctx, this.tileMap, camera);

        if (this._corruptionProfile) {
            this.tileRenderer.renderCorruptionOverlay(ctx, this._corruptionProfile);
        }

        ctx.fillStyle = '#fff';
        ctx.font = '8px monospace';
        ctx.textBaseline = 'top';
        ctx.fillText(`Pos: ${Math.round(this.player.position.x)}, ${Math.round(this.player.position.y)}`, 2, 50);
        ctx.fillText(`HP: ${this.context.state.player.hp}/${this.context.state.player.maxHp}`, 2, 60);

        if (this._inSanctuary) {
            PixelText.draw(ctx, 'SANCTUARY', 160, 8, {
                align: 'center',
                color: '#8fd3ff',
            });
        }

        if (this._messageTimer > 0) {
            ctx.fillStyle = 'rgba(8, 10, 16, 0.88)';
            ctx.fillRect(72, 146, 176, 18);
            ctx.strokeStyle = '#6f7b8a';
            ctx.strokeRect(72.5, 146.5, 175, 17);
            PixelText.draw(ctx, PixelText.fitText(ctx, this._message, 164, { size: 8 }), 160, 151, {
                align: 'center',
                color: '#ffd56a',
            });
        }
    }
}
