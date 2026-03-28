import { DAMAGE } from '../data/constants.js';

export class DamageCalculator {
    static calcFightDamage(baseDamage, timingMult = 1, hitCount = 1, soulIntegrity = 100) {
        const soulMult = this.getSoulAttackMultiplier(soulIntegrity);
        return Math.round(baseDamage * timingMult * hitCount * soulMult);
    }

    static calcDodgeDamage(enemyDmg, dodgedCount, totalCircles, soulIntegrity = 100) {
        if (totalCircles === 0) return Math.round(enemyDmg * this.getSoulDefenseMultiplier(soulIntegrity));

        const missedCount = totalCircles - dodgedCount;
        if (missedCount <= 0) {
            return 0;
        }

        const missedRatio = missedCount / totalCircles;
        const damageRatio = DAMAGE.PARTIAL_DODGE_MIN_RATIO
            + ((1 - DAMAGE.PARTIAL_DODGE_MIN_RATIO) * missedRatio);
        return Math.max(1, Math.round(enemyDmg * damageRatio * this.getSoulDefenseMultiplier(soulIntegrity)));
    }

    static calcBlockDamage(enemyDmg, shieldReduction, isBroken, flatReduction = 0, soulIntegrity = 100) {
        if (isBroken) {
            return Math.round(enemyDmg * (1 - DAMAGE.BROKEN_SHIELD_REDUCTION) * this.getSoulDefenseMultiplier(soulIntegrity));
        }

        const reduced = Math.max(0, (enemyDmg * (1 - shieldReduction)) - flatReduction);
        return Math.round(reduced * this.getSoulDefenseMultiplier(soulIntegrity));
    }

    static getSoulAttackMultiplier(soulIntegrity = 100) {
        if (soulIntegrity >= 80) return 1 + DAMAGE.SOUL_STABLE_ATTACK_BONUS;
        if (soulIntegrity <= 30) return 1 - DAMAGE.SOUL_LOW_ATTACK_PENALTY;
        return 1;
    }

    static getSoulDefenseMultiplier(soulIntegrity = 100) {
        if (soulIntegrity >= 80) return 1 - DAMAGE.SOUL_STABLE_DEFENSE_BONUS;
        if (soulIntegrity <= 30) return 1 + DAMAGE.SOUL_LOW_DEFENSE_PENALTY;
        return 1;
    }
}
