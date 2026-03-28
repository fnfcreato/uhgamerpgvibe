import { DamageCalculator } from './DamageCalculator.js';
import { SHIELD_DEFS } from '../data/shields.js';

export class BlockSystem {
    constructor(playerState, inventoryState) {
        this.playerState = playerState;
        this.inventoryState = inventoryState;
    }

    getEquippedShield() {
        return this.inventoryState.equippedShield || this.playerState.equippedShield || null;
    }

    getShieldStatus() {
        const shield = this.getEquippedShield();
        if (!shield) {
            return null;
        }

        const shieldDef = SHIELD_DEFS[shield.defId];
        if (!shieldDef) {
            return null;
        }

        if (typeof shield.currentDurability !== 'number') {
            shield.currentDurability = shieldDef.maxDurability;
        }

        return {
            shield,
            shieldDef,
            currentDurability: shield.currentDurability,
            maxDurability: shieldDef.maxDurability,
            isBroken: shield.currentDurability <= 0,
        };
    }

    applyBlock(enemyDamage) {
        const shieldStatus = this.getShieldStatus();
        if (!shieldStatus) {
            const damage = DamageCalculator.calcBlockDamage(enemyDamage, 0, true, 0, this.playerState.soulIntegrity);
            return {
                shield: null,
                shieldDef: null,
                damage,
                absorbed: Math.max(0, enemyDamage - damage),
                currentDurability: 0,
                maxDurability: 0,
                isBroken: true,
                broke: false,
            };
        }

        const { shield, shieldDef, currentDurability, maxDurability, isBroken } = shieldStatus;
        const damage = DamageCalculator.calcBlockDamage(
            enemyDamage,
            shieldDef.reductionPercent,
            isBroken,
            shieldDef.flatReduction || 0,
            this.playerState.soulIntegrity,
        );

        let nextDurability = currentDurability;
        let broke = false;

        if (!isBroken) {
            nextDurability = Math.max(0, currentDurability - 1);
            shield.currentDurability = nextDurability;
            broke = nextDurability === 0;
        }

        return {
            shield,
            shieldDef,
            damage,
            absorbed: Math.max(0, enemyDamage - damage),
            currentDurability: nextDurability,
            maxDurability,
            isBroken: nextDurability <= 0,
            broke,
        };
    }
}
