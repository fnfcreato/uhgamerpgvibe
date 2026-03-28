import { SHIELD_DEFS } from '../data/shields.js';

export class InventoryManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.inventoryState = gameState.inventory;
        this.playerState = gameState.player;
        this._nextItemId = 1;

        this._syncEquipmentRefs();
    }

    _syncEquipmentRefs() {
        if (!Array.isArray(this.inventoryState.equippedSwords)) {
            this.inventoryState.equippedSwords = [null, null];
        }
        if (!Array.isArray(this.playerState.equippedSwords)) {
            this.playerState.equippedSwords = [null, null];
        }

        for (let i = 0; i < 2; i++) {
            const item = this.inventoryState.equippedSwords[i] || this.playerState.equippedSwords[i] || null;
            this.inventoryState.equippedSwords[i] = item;
            this.playerState.equippedSwords[i] = item;
        }

        const shield = this.inventoryState.equippedShield || this.playerState.equippedShield || null;
        this.inventoryState.equippedShield = shield;
        this.playerState.equippedShield = shield;
    }

    _createItem(defId, type) {
        const item = {
            instanceId: `${type}_${Date.now()}_${this._nextItemId++}`,
            defId,
            type,
        };

        if (type === 'shield') {
            const shieldDef = SHIELD_DEFS[defId];
            item.currentDurability = shieldDef ? shieldDef.maxDurability : 0;
        }

        return item;
    }

    addItem(defId, type) {
        if (this.inventoryState.items.length >= this.inventoryState.capacity) {
            return null;
        }

        const item = this._createItem(defId, type);
        this.inventoryState.items.push(item);
        return item;
    }

    findItem(instanceId) {
        return this.inventoryState.items.find((item) => item.instanceId === instanceId) || null;
    }

    removeItem(instanceId) {
        const index = this.inventoryState.items.findIndex((item) => item.instanceId === instanceId);
        if (index < 0) {
            return false;
        }

        const item = this.inventoryState.items[index];
        for (let i = 0; i < this.inventoryState.equippedSwords.length; i++) {
            if (this.inventoryState.equippedSwords[i]?.instanceId === instanceId) {
                this.inventoryState.equippedSwords[i] = null;
                this.playerState.equippedSwords[i] = null;
            }
        }
        if (this.inventoryState.equippedShield?.instanceId === instanceId) {
            this.inventoryState.equippedShield = null;
            this.playerState.equippedShield = null;
        }

        this.inventoryState.items.splice(index, 1);
        return item;
    }

    getItemsByType(type) {
        return this.inventoryState.items.filter((item) => item.type === type);
    }

    isEquipped(instanceId) {
        if (this.inventoryState.equippedShield?.instanceId === instanceId) {
            return true;
        }

        return this.inventoryState.equippedSwords.some((item) => item?.instanceId === instanceId);
    }

    equipSword(instanceId, slotIndex) {
        if (slotIndex < 0 || slotIndex >= this.inventoryState.equippedSwords.length) {
            return false;
        }

        const item = this.findItem(instanceId);
        if (!item || item.type !== 'sword') {
            return false;
        }

        for (let i = 0; i < this.inventoryState.equippedSwords.length; i++) {
            if (this.inventoryState.equippedSwords[i]?.instanceId === instanceId) {
                this.inventoryState.equippedSwords[i] = null;
                this.playerState.equippedSwords[i] = null;
            }
        }

        this.inventoryState.equippedSwords[slotIndex] = item;
        this.playerState.equippedSwords[slotIndex] = item;
        return true;
    }

    equipShield(instanceId) {
        const item = this.findItem(instanceId);
        if (!item || item.type !== 'shield') {
            return false;
        }

        this.inventoryState.equippedShield = item;
        this.playerState.equippedShield = item;
        return true;
    }

    unequipSword(slotIndex) {
        if (slotIndex < 0 || slotIndex >= this.inventoryState.equippedSwords.length) {
            return false;
        }

        this.inventoryState.equippedSwords[slotIndex] = null;
        this.playerState.equippedSwords[slotIndex] = null;
        return true;
    }

    unequipShield() {
        this.inventoryState.equippedShield = null;
        this.playerState.equippedShield = null;
        return true;
    }
}
