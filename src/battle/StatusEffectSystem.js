import { STATUS_EFFECTS } from '../data/constants.js';

export class StatusEffectSystem {
    static list(playerState) {
        if (!Array.isArray(playerState.statusEffects)) {
            playerState.statusEffects = [];
        }
        return playerState.statusEffects;
    }

    static apply(playerState, effect) {
        const effects = this.list(playerState);
        const meta = STATUS_EFFECTS[effect?.type];
        if (!meta) {
            return null;
        }

        const turns = Math.max(1, effect.turns ?? meta.defaultTurns ?? 1);
        const damage = effect.damagePerTurn ?? meta.defaultDamage ?? 0;
        const existing = effects.find((entry) => entry.type === effect.type);

        if (existing) {
            existing.turns = Math.max(existing.turns, turns);
            existing.damagePerTurn = Math.max(existing.damagePerTurn || 0, damage);
            return `${meta.shortLabel}!`;
        }

        effects.push({
            type: effect.type,
            turns,
            damagePerTurn: damage,
        });
        return `${meta.shortLabel}!`;
    }

    static onTurnStart(playerState) {
        const effects = this.list(playerState);
        if (effects.length === 0) {
            return { skippedTurn: false, damage: 0, messages: [] };
        }

        let skippedTurn = false;
        let damage = 0;
        const messages = [];

        for (const effect of effects) {
            if (effect.type === 'poisoned') {
                const tickDamage = Math.max(1, effect.damagePerTurn || STATUS_EFFECTS.poisoned.defaultDamage);
                damage += tickDamage;
                messages.push(`POISON ${tickDamage}`);
                effect.turns -= 1;
            } else if (effect.type === 'frozen') {
                skippedTurn = true;
                messages.push('FROZEN');
                effect.turns -= 1;
            }
        }

        playerState.statusEffects = effects.filter((effect) => effect.turns > 0);
        return { skippedTurn, damage, messages };
    }

    static clear(playerState, type = null) {
        const effects = this.list(playerState);
        playerState.statusEffects = type
            ? effects.filter((effect) => effect.type !== type)
            : [];
    }

    static has(playerState, type) {
        return this.list(playerState).some((effect) => effect.type === type);
    }

    static getDisplayData(playerState) {
        return this.list(playerState)
            .map((effect) => {
                const meta = STATUS_EFFECTS[effect.type];
                if (!meta) return null;
                return {
                    type: effect.type,
                    shortLabel: meta.shortLabel,
                    label: meta.label,
                    color: meta.color,
                    turns: effect.turns,
                };
            })
            .filter(Boolean);
    }
}
