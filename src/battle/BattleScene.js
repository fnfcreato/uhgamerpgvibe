import { SceneType } from '../core/SceneManager.js';
import { BattleFlow, BattleState } from './BattleFlow.js';
import { EnemyBattle } from './EnemyBattle.js';
import { AttackTimingBar } from './AttackTimingBar.js';
import { DodgeMiniGame } from './DodgeMiniGame.js';
import { Button } from '../ui/Button.js';
import { MenuUI } from '../ui/MenuUI.js';
import { SWORD_DEFS } from '../data/swords.js';
import { SHIELD_DEFS } from '../data/shields.js';
import { CONSUMABLE_DEFS } from '../data/consumables.js';
import { CANVAS } from '../data/constants.js';
import { PixelText } from '../rendering/PixelText.js';

const W = CANVAS.INTERNAL_WIDTH;
const H = CANVAS.INTERNAL_HEIGHT;
const PLAYER_X = 60;
const PLAYER_Y = H * 0.52;
const ENEMY_X = W - 60;
const ENEMY_Y = H * 0.45;
const GROUND_Y = H * 0.65;

export class BattleScene {
    constructor(context, enemyDef, callbacks) {
        this.type = SceneType.FULLSCREEN;
        this.context = context;
        this.callbacks = callbacks || {};

        const enemyBattle = new EnemyBattle(enemyDef);
        this.flow = new BattleFlow(context.state.player, context.state.inventory, [enemyBattle]);
        this.enemy = enemyBattle;

        this.timingBar = null;
        this.dodgeGame = null;
        this._endTimer = 0;
        this._prevState = BattleState.INTRO;
        this._shakeTimer = 0;
        this._shakeX = 0;
        this._shakeY = 0;
        this._focusIndex = 0;
        this._victoryHandled = false;
        this._victorySummary = null;
        this._enemyDeathProgress = 0;

        const btnW = 60;
        const btnH = 16;
        const btnX = 12;
        const btnBaseY = H - 38;

        this.fightBtn = new Button(btnX, btnBaseY, btnW, btnH, 'FIGHT', () => {
            this.flow.selectFight();
        });
        this.blockBtn = new Button(btnX + btnW + 8, btnBaseY, btnW, btnH, 'BLOCK', () => {
            this.flow.selectBlock();
        });
        this.healBtn = new Button(btnX + (btnW + 8) * 2, btnBaseY, btnW, btnH, 'HEAL', () => {
            this._useHealingItem();
        });
        this.actionButtons = [this.fightBtn, this.blockBtn, this.healBtn];
        this.swordButtons = [];
        this._swordFocusIndex = 0;

        this._updateFocus(this.actionButtons, this._focusIndex);
    }

    onEnter() {
        this.context.input.setContext('battle');
        this.context.audio.pauseBGM();
    }

    onExit() {
        this.context.input.setContext('exploration');
        this.context.audio.resumeBGM();
    }

    _updateFocus(buttons, index) {
        buttons.forEach((button, buttonIndex) => {
            button.focused = buttonIndex === index;
        });
    }

    _getHealingItems() {
        return this.context.state.inventory.items
            .filter((item) => item.type === 'consumable')
            .map((item) => ({ item, def: CONSUMABLE_DEFS[item.defId] }))
            .filter((entry) => Boolean(entry.def));
    }

    _updateActionButtons() {
        const healingItems = this._getHealingItems();
        this.healBtn.label = healingItems.length > 0 ? `HEAL x${healingItems.length}` : 'HEAL';
        this.healBtn.disabled = healingItems.length === 0;
    }

    _useHealingItem() {
        const healingItems = this._getHealingItems();
        if (healingItems.length === 0) {
            this.flow.showFeedback('NO TONIC');
            return;
        }

        const { item, def } = healingItems[0];
        const healed = this.flow.selectHeal(def.healAmount, def.name);
        if (healed <= 0) {
            this.flow.showFeedback('HP FULL');
            return;
        }

        this.context.inventory.removeItem(item.instanceId);
        this.context.audio.playSFX('heal');
        this._updateActionButtons();
    }

    _buildSwordButtons() {
        const swords = this.context.state.player.equippedSwords.filter((item) => item !== null);
        const btnW = 100;
        const btnH = 14;
        const btnX = 20;
        const startY = H - 38;

        this.swordButtons = swords.map((item, index) => {
            const def = SWORD_DEFS[item.defId];
            return new Button(btnX, startY + index * 18, btnW, btnH, `${def.name} (${def.damage})`, () => {
                this.flow.selectSword(def);
                this.timingBar = new AttackTimingBar(def);
            });
        });

        if (swords.length === 1) {
            const def = SWORD_DEFS[swords[0].defId];
            this.flow.selectSword(def);
            this.timingBar = new AttackTimingBar(def);
            return;
        }

        this._swordFocusIndex = 0;
        this._updateFocus(this.swordButtons, this._swordFocusIndex);
    }

    _startDodge() {
        const pattern = this.enemy.dodgePatterns;
        if (!pattern || pattern.length === 0) {
            this.flow.applyDodgeResult(0, 0);
            return;
        }
        this.dodgeGame = new DodgeMiniGame(pattern, W / 2, H * 0.4);
    }

    _triggerShake() {
        this._shakeTimer = 0.15;
    }

    _openPauseMenu() {
        this.context.scenes.push(new MenuUI(this.context, {
            returnContext: 'battle',
            ownerScene: this,
            allowStateActions: false,
        }));
    }

    handleInput(input) {
        const state = this.flow.state;

        if (state !== BattleState.VICTORY && state !== BattleState.DEFEAT && input.isActionPressed('pause')) {
            this._openPauseMenu();
            return;
        }

        if (state === BattleState.PLAYER_TURN) {
            if (input.isActionPressed('moveLeft')) {
                this._focusIndex = (this._focusIndex - 1 + this.actionButtons.length) % this.actionButtons.length;
                this._updateFocus(this.actionButtons, this._focusIndex);
            }
            if (input.isActionPressed('moveRight') || input.isActionPressed('moveDown')) {
                this._focusIndex = (this._focusIndex + 1) % this.actionButtons.length;
                this._updateFocus(this.actionButtons, this._focusIndex);
            }
            if (input.isActionPressed('confirm')) {
                this.actionButtons[this._focusIndex].activate();
            }

            const pointer = input.getPointerPos();
            for (const button of this.actionButtons) {
                button.updatePointer(pointer);
                if (button.hovered && input.isPointerClicked()) {
                    button.activate();
                }
            }
        }

        if (state === BattleState.SWORD_SELECT) {
            if (input.isActionPressed('cancel')) {
                this.flow.cancelSwordSelect();
                return;
            }
            this._handleButtonNav(input, this.swordButtons, '_swordFocusIndex');
        }

        if (state === BattleState.TIMING_BAR && this.timingBar) {
            if (input.isActionPressed('confirm') || input.isPointerClicked()) {
                this.timingBar.press();
            }
        }

        if (state === BattleState.DODGE_PHASE && this.dodgeGame) {
            const dodgeKeys = ['KeyA', 'KeyS', 'KeyD', 'KeyW'];
            for (const key of dodgeKeys) {
                if (input.isKeyPressed(key)) {
                    this.dodgeGame.pressKey(key);
                }
            }
        }
    }

    _handleButtonNav(input, buttons, focusProp) {
        if (buttons.length === 0) return;
        if (input.isActionPressed('moveUp')) {
            this[focusProp] = (this[focusProp] - 1 + buttons.length) % buttons.length;
            this._updateFocus(buttons, this[focusProp]);
        }
        if (input.isActionPressed('moveDown')) {
            this[focusProp] = (this[focusProp] + 1) % buttons.length;
            this._updateFocus(buttons, this[focusProp]);
        }
        if (input.isActionPressed('confirm')) {
            buttons[this[focusProp]].activate();
        }

        const pointer = input.getPointerPos();
        for (const button of buttons) {
            button.updatePointer(pointer);
            if (button.hovered && input.isPointerClicked()) {
                button.activate();
            }
        }
    }

    _resolveVictory() {
        if (this._victoryHandled) {
            return;
        }

        this._victoryHandled = true;
        this._enemyDeathProgress = 0;
        this.context.audio.playSFX('enemy_die');
        this._victorySummary = this.callbacks.onVictory ? (this.callbacks.onVictory() || { lines: [] }) : { lines: [] };
    }

    update(dt) {
        this._updateActionButtons();
        this.flow.update(dt);

        if (this.flow.state === BattleState.SWORD_SELECT && this._prevState !== BattleState.SWORD_SELECT) {
            this._buildSwordButtons();
        }

        if (this.flow.state === BattleState.DODGE_PHASE && this._prevState !== BattleState.DODGE_PHASE) {
            this._startDodge();
        }

        if (this.flow.state === BattleState.APPLY_ENEMY_DAMAGE && this._prevState !== BattleState.APPLY_ENEMY_DAMAGE) {
            if (this.flow.lastBlockResult) {
                this.context.audio.playSFX('block');
            } else if (this.flow.lastDamageTaken > 0) {
                this.context.audio.playSFX('player_hit');
            } else {
                this.context.audio.playSFX('dodge_ok');
            }
            if (this.flow.lastDamageTaken > 0) {
                this._triggerShake();
            }
        }

        if (this.flow.state === BattleState.TIMING_BAR && this.timingBar) {
            this.timingBar.update(dt);
            if (this.timingBar.isComplete) {
                const result = this.timingBar.getResults();
                this.flow.applyTimingResult(result.timingMult, result.hitCount);
                if (result.hitCount > 0 && result.timingMult > 0) {
                    this.context.audio.playSFX('sword_hit');
                }
                this._triggerShake();
                this.timingBar = null;
            }
        }

        if (this.flow.state === BattleState.DODGE_PHASE && this.dodgeGame) {
            this.dodgeGame.update(dt);
            if (this.dodgeGame.isComplete) {
                const result = this.dodgeGame.getResults();
                this.flow.applyDodgeResult(result.dodgedCount, result.totalCircles);
                if (result.totalCircles > 0 && result.dodgedCount === result.totalCircles) {
                    this.context.audio.playSFX('dodge_ok');
                }
                this.dodgeGame = null;
            }
        }

        for (const button of this.actionButtons) button.update(dt);
        for (const button of this.swordButtons) button.update(dt);

        if (this._shakeTimer > 0) {
            this._shakeTimer -= dt;
            this._shakeX = (Math.random() - 0.5) * 4;
            this._shakeY = (Math.random() - 0.5) * 4;
        } else {
            this._shakeX = 0;
            this._shakeY = 0;
        }

        if (this.flow.state === BattleState.VICTORY) {
            this._resolveVictory();
            this._enemyDeathProgress = Math.min(1, this._enemyDeathProgress + dt / 0.8);
        }

        this._prevState = this.flow.state;

        if (this.flow.state === BattleState.VICTORY || this.flow.state === BattleState.DEFEAT) {
            this._endTimer += dt;
            if (this._endTimer >= 2.8) {
                const wasVictory = this.flow.state === BattleState.VICTORY;
                this.context.scenes.pop();
                if (!wasVictory && this.callbacks.onDefeat) {
                    this.callbacks.onDefeat();
                }
            }
        }
    }

    render(ctx) {
        const state = this.flow.state;

        ctx.save();
        ctx.translate(Math.round(this._shakeX), Math.round(this._shakeY));

        ctx.fillStyle = '#0e0e2c';
        ctx.fillRect(0, 0, W, GROUND_Y);

        ctx.fillStyle = '#1a2a1a';
        ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

        ctx.strokeStyle = '#3a5a3a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, GROUND_Y);
        ctx.lineTo(W, GROUND_Y);
        ctx.stroke();

        ctx.strokeStyle = '#223322';
        for (let i = 0; i < 6; i++) {
            const y = GROUND_Y + 8 + i * 6;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(W, y);
            ctx.stroke();
        }

        this._drawPlayer(ctx, PLAYER_X, PLAYER_Y);
        this._drawEnemyChar(ctx, ENEMY_X, ENEMY_Y, state === BattleState.VICTORY ? this._enemyDeathProgress : 0);

        ctx.fillStyle = '#111';
        ctx.fillRect(0, H - 46, W, 46);
        ctx.strokeStyle = '#444';
        ctx.beginPath();
        ctx.moveTo(0, H - 46);
        ctx.lineTo(W, H - 46);
        ctx.stroke();

        const player = this.context.state.player;
        this._drawHPBar(ctx, 10, H - 20, 80, 8, player.hp, player.maxHp, '#4a4');
        ctx.fillStyle = '#fff';
        ctx.font = '8px monospace';
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
        ctx.fillText(`HP ${player.hp}/${player.maxHp}`, 10, H - 30);

        this._drawShieldStatus(ctx, 100, H - 31);

        this._drawHPBar(ctx, W - 90, 8, 80, 8, this.enemy.hp, this.enemy.maxHp, '#e44');
        ctx.fillStyle = '#fff';
        ctx.font = '8px monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText(this.enemy.name, W - 10, 18);

        if (state === BattleState.INTRO) {
            this._drawCenterText(ctx, `${this.enemy.name} appears!`, '#fff');
        }

        if (state === BattleState.PLAYER_TURN) {
            for (const button of this.actionButtons) button.draw(ctx);
            ctx.fillStyle = '#aaa';
            ctx.font = '8px monospace';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText('Your turn!', 220, H - 38);
        }

        if (state === BattleState.SWORD_SELECT) {
            ctx.fillStyle = '#ccc';
            ctx.font = '8px monospace';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'bottom';
            ctx.fillText('Pick your sword:', 20, this.swordButtons[0]?.y - 4 || H - 50);
            for (const button of this.swordButtons) button.draw(ctx);
        }

        if (state === BattleState.TIMING_BAR && this.timingBar) {
            const barW = 140;
            const barH = 12;
            const barX = W / 2 - barW / 2;
            const barY = H * 0.38;
            this.timingBar.render(ctx, barX, barY, barW, barH);

            ctx.fillStyle = '#aaa';
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(this.flow.selectedSword.name, W / 2, barY - 14);
            ctx.fillText('Tap or press OK to strike!', W / 2, barY - 4);
        }

        if (state === BattleState.ENEMY_ATTACK_INTRO) {
            this._drawCenterText(ctx, this.flow.blocked ? 'Brace behind your shield!' : `${this.enemy.name} attacks!`, '#ff8');
        }

        if (state === BattleState.DODGE_PHASE && this.dodgeGame) {
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(0, 0, W, H - 46);

            ctx.fillStyle = '#fff';
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText('DODGE! Tap the mobile keys or use W/A/S/D.', W / 2, 4);

            this.dodgeGame.render(ctx);
        }

        if (state === BattleState.VICTORY) {
            this._drawCenterText(ctx, 'VICTORY!', '#4f4');
            this._drawVictorySummary(ctx);
        }

        if (state === BattleState.DEFEAT) {
            this._drawCenterText(ctx, 'DEFEAT...', '#f44');
        }

        if (this.flow.feedbackTimer > 0) {
            const alpha = Math.min(1, this.flow.feedbackTimer / 0.3);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#ff0';
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const floatY = H * 0.3 - (1 - this.flow.feedbackTimer) * 10;
            ctx.fillText(this.flow.feedbackText, W / 2, floatY);
            ctx.globalAlpha = 1;
        }

        ctx.restore();
        ctx.textAlign = 'left';
    }

    _drawVictorySummary(ctx) {
        const lines = this._victorySummary?.lines?.length ? this._victorySummary.lines : ['No rewards'];
        ctx.fillStyle = 'rgba(8, 10, 16, 0.94)';
        ctx.fillRect(90, 52, 140, 74);
        ctx.strokeStyle = '#6f7b8a';
        ctx.strokeRect(90.5, 52.5, 139, 73);
        PixelText.draw(ctx, this._victorySummary?.title || 'Rewards', 160, 58, {
            align: 'center',
            color: '#8fd3ff',
        });
        for (let i = 0; i < Math.min(lines.length, 4); i++) {
            PixelText.draw(ctx, PixelText.fitText(ctx, lines[i], 120, { size: 8 }), 100, 70 + i * 12, {
                color: '#fff',
            });
        }
    }

    _drawCenterText(ctx, text, color) {
        ctx.fillStyle = color;
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, W / 2, H * 0.35);
    }

    _getShieldStatus() {
        const shield = this.context.state.player.equippedShield;
        if (!shield) {
            return null;
        }

        const shieldDef = SHIELD_DEFS[shield.defId];
        if (!shieldDef) {
            return null;
        }

        return {
            shield,
            shieldDef,
            currentDurability: shield.currentDurability,
            maxDurability: shieldDef.maxDurability,
            isBroken: shield.currentDurability <= 0,
        };
    }

    _drawPlayer(ctx, x, y) {
        const shieldStatus = this._getShieldStatus();

        ctx.fillStyle = '#5bc';
        ctx.fillRect(x - 5, y - 20, 10, 10);

        ctx.fillStyle = '#fff';
        ctx.fillRect(x + 1, y - 17, 2, 2);
        ctx.fillStyle = '#000';
        ctx.fillRect(x + 2, y - 17, 1, 1);

        ctx.fillStyle = '#47a';
        ctx.fillRect(x - 6, y - 10, 12, 12);

        ctx.fillStyle = '#5bc';
        ctx.fillRect(x + 6, y - 9, 4, 3);
        ctx.fillStyle = '#ccc';
        ctx.fillRect(x + 10, y - 14, 2, 10);
        ctx.fillStyle = '#aa8';
        ctx.fillRect(x + 8, y - 6, 6, 2);

        ctx.fillStyle = '#5bc';
        ctx.fillRect(x - 10, y - 8, 4, 3);

        let shieldColor = '#333';
        if (shieldStatus) {
            shieldColor = shieldStatus.isBroken
                ? '#6a2d2d'
                : shieldStatus.currentDurability <= shieldStatus.maxDurability / 2
                    ? '#8d7a54'
                    : '#666';
        }
        ctx.fillStyle = shieldColor;
        ctx.fillRect(x - 12, y - 10, 4, 8);

        if (shieldStatus && (shieldStatus.isBroken || shieldStatus.currentDurability <= shieldStatus.maxDurability / 2)) {
            ctx.strokeStyle = shieldStatus.isBroken ? '#f88' : '#ddd';
            ctx.beginPath();
            ctx.moveTo(x - 12, y - 9);
            ctx.lineTo(x - 9, y - 4);
            ctx.moveTo(x - 11, y - 6);
            ctx.lineTo(x - 8, y - 8);
            ctx.stroke();
        }

        ctx.fillStyle = '#345';
        ctx.fillRect(x - 4, y + 2, 4, 6);
        ctx.fillRect(x + 1, y + 2, 4, 6);

        ctx.fillStyle = '#543';
        ctx.fillRect(x - 4, y + 8, 5, 2);
        ctx.fillRect(x + 1, y + 8, 5, 2);
    }

    _drawEnemyChar(ctx, x, y, deathProgress = 0) {
        const s = 1.3 - deathProgress * 0.35;
        const sink = deathProgress * 8;
        const alpha = 1 - deathProgress * 0.85;

        ctx.save();
        ctx.globalAlpha = Math.max(0.15, alpha);
        ctx.fillStyle = '#c33';
        ctx.fillRect(x - 10 * s, y - 14 * s + sink, 20 * s, 20 * s);

        if (deathProgress < 0.75) {
            ctx.fillStyle = '#fff';
            ctx.fillRect(x - 8 * s, y - 8 * s + sink, 5 * s, 5 * s);
            ctx.fillRect(x + 2 * s, y - 8 * s + sink, 5 * s, 5 * s);

            ctx.fillStyle = '#000';
            ctx.fillRect(x - 7 * s, y - 6 * s + sink, 3 * s, 3 * s);
            ctx.fillRect(x + 3 * s, y - 6 * s + sink, 3 * s, 3 * s);
        }

        ctx.fillStyle = '#611';
        ctx.fillRect(x - 4 * s, y + 4 * s + sink, 8 * s, 3 * s);

        ctx.fillStyle = '#922';
        ctx.fillRect(x - 8 * s, y + 6 * s + sink, 6 * s, 6 * s);
        ctx.fillRect(x + 2 * s, y + 6 * s + sink, 6 * s, 6 * s);

        if (deathProgress > 0) {
            ctx.fillStyle = '#ffcc88';
            for (let i = 0; i < 5; i++) {
                const px = x - 10 + i * 6;
                const py = y - 8 - deathProgress * 18 + (i % 2) * 3;
                ctx.fillRect(px, py, 2, 2);
            }
        }

        ctx.restore();

        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(x, GROUND_Y, 16 * (1 - deathProgress * 0.2), 4, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawHPBar(ctx, x, y, width, height, current, max, color) {
        ctx.fillStyle = '#111';
        ctx.fillRect(x, y, width, height);

        const fill = Math.max(0, current / max) * (width - 2);
        ctx.fillStyle = color;
        ctx.fillRect(x + 1, y + 1, fill, height - 2);

        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
    }

    _drawShieldStatus(ctx, x, y) {
        const shieldStatus = this._getShieldStatus();
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.font = '8px monospace';

        if (!shieldStatus) {
            ctx.fillStyle = '#888';
            ctx.fillText('Shield: none', x, y);
            return;
        }

        const { shieldDef, currentDurability, maxDurability, isBroken } = shieldStatus;
        this._drawHPBar(ctx, x, y + 11, 68, 6, currentDurability, maxDurability, isBroken ? '#b04a4a' : '#5aa2c8');
        ctx.fillStyle = '#fff';
        ctx.fillText(`${shieldDef.name} ${currentDurability}/${maxDurability}`, x, y);
        if (isBroken) {
            ctx.fillStyle = '#ff8a6a';
            ctx.fillText('BROKEN', x + 74, y + 8);
        }
    }
}
