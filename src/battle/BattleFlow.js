import { DamageCalculator } from './DamageCalculator.js';
import { BlockSystem } from './BlockSystem.js';
import { StatusEffectSystem } from './StatusEffectSystem.js';

export const BattleState = {
    INTRO: 'intro',
    PLAYER_TURN: 'player_turn',
    SWORD_SELECT: 'sword_select',
    TIMING_BAR: 'timing_bar',
    EXECUTE_FIGHT: 'execute_fight',
    ENEMY_ATTACK_INTRO: 'enemy_attack_intro',
    DODGE_PHASE: 'dodge_phase',
    APPLY_ENEMY_DAMAGE: 'apply_enemy_damage',
    VICTORY: 'victory',
    DEFEAT: 'defeat',
};

export class BattleFlow {
    constructor(playerState, inventoryState, enemies) {
        this.playerState = playerState;
        this.inventoryState = inventoryState;
        this.enemies = enemies;
        this.currentEnemy = enemies[0];
        this.state = BattleState.INTRO;
        this._timer = 0;

        this.blockSystem = new BlockSystem(playerState, inventoryState);
        this.selectedSword = null;
        this.lastDamageDealt = 0;
        this.lastDamageTaken = 0;
        this.lastHealAmount = 0;
        this.lastBlockResult = null;
        this.blocked = false;
        this.feedbackText = '';
        this.feedbackTimer = 0;

        this._pendingDodgeResult = null;
        this._pendingTimingMult = 0;
        this._pendingHitCount = 0;
    }

    showFeedback(text) {
        this._showFeedback(text);
    }

    selectFight() {
        if (this.state !== BattleState.PLAYER_TURN) return;
        this.state = BattleState.SWORD_SELECT;
        this._timer = 0;
    }

    selectBlock() {
        if (this.state !== BattleState.PLAYER_TURN) return;
        this.blocked = true;
        this.lastBlockResult = null;
        this._showFeedback('GUARD UP!');
        this.state = BattleState.ENEMY_ATTACK_INTRO;
        this._timer = 0;
    }

    selectHeal(healAmount, itemName = 'Potion') {
        if (this.state !== BattleState.PLAYER_TURN) return 0;
        if (this.playerState.hp >= this.playerState.maxHp) return 0;

        const healed = Math.min(healAmount, this.playerState.maxHp - this.playerState.hp);
        this.playerState.hp += healed;
        this.lastHealAmount = healed;
        this.lastBlockResult = null;
        this._showFeedback(`+${healed} HP ${itemName}`);
        this.state = BattleState.ENEMY_ATTACK_INTRO;
        this._timer = 0;
        return healed;
    }

    selectSword(swordDef) {
        if (this.state !== BattleState.SWORD_SELECT) return;
        this.selectedSword = swordDef;
        this.state = BattleState.TIMING_BAR;
        this._timer = 0;
    }

    cancelSwordSelect() {
        if (this.state !== BattleState.SWORD_SELECT) return;
        this.state = BattleState.PLAYER_TURN;
        this._timer = 0;
    }

    applyTimingResult(timingMult, hitCount) {
        this.state = BattleState.EXECUTE_FIGHT;
        this._timer = 0;
        this._pendingTimingMult = timingMult;
        this._pendingHitCount = hitCount;
    }

    applyDodgeResult(dodgedCount, totalCircles) {
        this._pendingDodgeResult = { dodgedCount, totalCircles };
        this.state = BattleState.APPLY_ENEMY_DAMAGE;
        this._timer = 0;
    }

    _showFeedback(text) {
        this.feedbackText = text;
        this.feedbackTimer = 0.95;
    }

    _startPlayerTurn() {
        const statusResult = StatusEffectSystem.onTurnStart(this.playerState);
        if (statusResult.damage > 0) {
            this.playerState.hp = Math.max(0, this.playerState.hp - statusResult.damage);
            this.lastDamageTaken = statusResult.damage;
        } else {
            this.lastDamageTaken = 0;
        }

        if (this.playerState.hp <= 0) {
            this.state = BattleState.DEFEAT;
            this._timer = 0;
            this._showFeedback(statusResult.messages.join(' + ') || 'DEFEAT');
            return;
        }

        if (statusResult.skippedTurn) {
            this.state = BattleState.ENEMY_ATTACK_INTRO;
            this._timer = 0;
            this._showFeedback(statusResult.messages.join(' + '));
            return;
        }

        this.state = BattleState.PLAYER_TURN;
        this._timer = 0;
        if (statusResult.messages.length > 0) {
            this._showFeedback(statusResult.messages.join(' + '));
        }
    }

    _applyAttackStatusEffects(damageTaken) {
        if (damageTaken <= 0 || !Array.isArray(this.currentEnemy.attackStatusEffects)) {
            return [];
        }

        const messages = [];
        const blockedAttack = Boolean(this.lastBlockResult?.shield);
        for (const effect of this.currentEnemy.attackStatusEffects) {
            const chance = effect.chance ?? 1;
            if (Math.random() > chance) {
                continue;
            }
            if (blockedAttack && effect.type === 'frozen') {
                messages.push('BLOCKED FRZ!');
                continue;
            }
            const applied = StatusEffectSystem.apply(this.playerState, effect);
            if (applied) {
                messages.push(applied);
            }
        }
        return messages;
    }

    update(dt) {
        this._timer += dt;

        if (this.feedbackTimer > 0) {
            this.feedbackTimer -= dt;
        }

        switch (this.state) {
            case BattleState.INTRO:
                if (this._timer >= 1.0) {
                    this._startPlayerTurn();
                }
                break;

            case BattleState.EXECUTE_FIGHT: {
                const dmg = DamageCalculator.calcFightDamage(
                    this.selectedSword.damage,
                    this._pendingTimingMult,
                    this._pendingHitCount,
                    this.playerState.soulIntegrity,
                );
                this.currentEnemy.takeDamage(dmg);
                this.lastDamageDealt = dmg;
                this.lastBlockResult = null;
                this.lastHealAmount = 0;

                this._showFeedback(dmg > 0 ? `${dmg} DMG!` : 'MISS!');

                this.state = this.currentEnemy.isAlive ? BattleState.ENEMY_ATTACK_INTRO : BattleState.VICTORY;
                this._timer = 0;
                break;
            }

            case BattleState.ENEMY_ATTACK_INTRO:
                if (this._timer >= 0.8) {
                    this.state = this.blocked ? BattleState.APPLY_ENEMY_DAMAGE : BattleState.DODGE_PHASE;
                    if (this.blocked) {
                        this._pendingDodgeResult = null;
                    }
                    this._timer = 0;
                }
                break;

            case BattleState.APPLY_ENEMY_DAMAGE: {
                let dmg = this.currentEnemy.damage;
                this.lastBlockResult = null;
                this.lastHealAmount = 0;

                if (this.blocked) {
                    const result = this.blockSystem.applyBlock(dmg);
                    dmg = result.damage;
                    this.lastBlockResult = result;
                    this.blocked = false;

                    if (!result.shield) {
                        this._showFeedback('NO SHIELD!');
                    } else if (result.broke) {
                        this._showFeedback(`BROKE, -${dmg}`);
                    } else if (dmg <= 0) {
                        this._showFeedback('FULL BLOCK!');
                    } else {
                        this._showFeedback(`BLOCKED ${result.absorbed}`);
                    }
                } else if (this._pendingDodgeResult) {
                    dmg = DamageCalculator.calcDodgeDamage(
                        dmg,
                        this._pendingDodgeResult.dodgedCount,
                        this._pendingDodgeResult.totalCircles,
                        this.playerState.soulIntegrity,
                    );
                    this._pendingDodgeResult = null;
                    this._showFeedback(dmg > 0 ? `-${dmg} HP` : 'DODGED ALL!');
                }

                this.playerState.hp = Math.max(0, this.playerState.hp - dmg);
                this.lastDamageTaken = dmg;

                const effectMessages = this._applyAttackStatusEffects(dmg);
                if (effectMessages.length > 0) {
                    const baseText = this.feedbackText;
                    this._showFeedback(baseText ? `${baseText} ${effectMessages.join(' ')}` : effectMessages.join(' '));
                }

                if (this.playerState.hp <= 0) {
                    this.state = BattleState.DEFEAT;
                    this._timer = 0;
                } else {
                    this._startPlayerTurn();
                }
                break;
            }
        }
    }
}
