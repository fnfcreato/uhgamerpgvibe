import { SceneType } from '../core/SceneManager.js';
import { Button } from './Button.js';
import { PixelText } from '../rendering/PixelText.js';
import { SWORD_DEFS } from '../data/swords.js';
import { SHIELD_DEFS } from '../data/shields.js';
import { ARMOR_DEFS } from '../data/armors.js';
import { CONSUMABLE_DEFS } from '../data/consumables.js';

const LIST_X = 28;
const LIST_Y = 54;
const LIST_W = 136;
const ROW_H = 18;
const VISIBLE_ROWS = 5;
const DETAIL_X = 178;

export class InventoryUI {
    constructor(context, options = {}) {
        this.type = SceneType.MODAL_OVERLAY;
        this.context = context;
        this.returnContext = options.returnContext || 'menu';
        this._selectedIndex = 0;
        this._scrollOffset = 0;
        this._actionFocusIndex = 0;
        this._message = '';
        this._messageTimer = 0;

        this.itemButtons = [];
        this.actionButtons = [
            new Button(178, 108, 54, 14, 'USE', () => this._useSelectedItem()),
            new Button(238, 108, 54, 14, 'SLOT 1', () => this._equipSword(0)),
            new Button(178, 126, 54, 14, 'SLOT 2', () => this._equipSword(1)),
            new Button(238, 126, 54, 14, 'EQUIP', () => this._equipSelectedGear()),
            new Button(178, 144, 54, 14, 'UNEQUIP', () => this._unequipSelected()),
            new Button(238, 144, 54, 14, 'BACK', () => this.context.scenes.pop()),
        ];

        this._rebuildItemButtons();
        this._syncActionButtons();
        this._syncActionFocus();
    }

    onEnter() {
        this.context.input.setContext('inventory');
    }

    onExit() {
        this.context.input.setContext(this.returnContext);
    }

    get _items() {
        return this.context.state.inventory.items;
    }

    get _selectedItem() {
        if (this._items.length === 0) {
            return null;
        }
        this._selectedIndex = Math.max(0, Math.min(this._selectedIndex, this._items.length - 1));
        return this._items[this._selectedIndex];
    }

    _showMessage(text) {
        this._message = text;
        this._messageTimer = 1.2;
    }

    _ensureSelectionVisible() {
        const maxOffset = Math.max(0, this._items.length - VISIBLE_ROWS);
        if (this._selectedIndex < this._scrollOffset) {
            this._scrollOffset = this._selectedIndex;
        }
        if (this._selectedIndex >= this._scrollOffset + VISIBLE_ROWS) {
            this._scrollOffset = this._selectedIndex - VISIBLE_ROWS + 1;
        }
        this._scrollOffset = Math.max(0, Math.min(this._scrollOffset, maxOffset));
    }

    _rebuildItemButtons() {
        if (this._selectedIndex >= this._items.length) {
            this._selectedIndex = Math.max(0, this._items.length - 1);
        }
        this._ensureSelectionVisible();

        const visibleItems = this._items.slice(this._scrollOffset, this._scrollOffset + VISIBLE_ROWS);
        this.itemButtons = visibleItems.map((item, offset) => {
            const index = this._scrollOffset + offset;
            const button = new Button(LIST_X, LIST_Y + offset * ROW_H, LIST_W, 14, this._getItemLabel(item), () => {
                this._selectedIndex = index;
                this._syncActionButtons();
            });
            button.focused = index === this._selectedIndex;
            return button;
        });
    }

    _getItemLabel(item) {
        const equipped = this.context.inventory.isEquipped(item.instanceId) ? ' *' : '';
        if (item.type === 'sword') {
            const def = SWORD_DEFS[item.defId];
            return `${def?.name || item.defId}${equipped}`;
        }
        if (item.type === 'shield') {
            const def = SHIELD_DEFS[item.defId];
            return `${def?.name || item.defId} ${item.currentDurability}/${def?.maxDurability || 0}${equipped}`;
        }
        if (item.type === 'armor') {
            const def = ARMOR_DEFS[item.defId];
            return `${def?.name || item.defId}${equipped}`;
        }

        const def = CONSUMABLE_DEFS[item.defId];
        return `${def?.name || item.defId}${equipped}`;
    }

    _useSelectedItem() {
        const item = this._selectedItem;
        if (!item || item.type !== 'consumable') {
            this._showMessage('Select a tonic first');
            return;
        }

        const def = CONSUMABLE_DEFS[item.defId];
        if (!def) {
            this._showMessage('Unknown item');
            return;
        }

        const player = this.context.state.player;
        if (player.hp >= player.maxHp) {
            this._showMessage('HP already full');
            return;
        }

        const healed = Math.min(def.healAmount, player.maxHp - player.hp);
        player.hp += healed;
        this.context.inventory.removeItem(item.instanceId);
        this.context.audio.playSFX('heal');
        this._afterInventoryChange(`Recovered ${healed} HP`);
    }

    _equipSword(slotIndex) {
        const item = this._selectedItem;
        if (!item || item.type !== 'sword') {
            this._showMessage('Select a sword first');
            return;
        }

        this.context.inventory.equipSword(item.instanceId, slotIndex);
        this._afterInventoryChange(`Equipped to slot ${slotIndex + 1}`);
    }

    _equipShield() {
        const item = this._selectedItem;
        if (!item || item.type !== 'shield') {
            this._showMessage('Select a shield first');
            return;
        }

        this.context.inventory.equipShield(item.instanceId);
        this._afterInventoryChange('Shield equipped');
    }

    _equipSelectedGear() {
        const item = this._selectedItem;
        if (!item || (item.type !== 'shield' && item.type !== 'armor')) {
            this._showMessage('Select armor or shield');
            return;
        }

        if (item.type === 'shield') {
            this.context.inventory.equipShield(item.instanceId);
            this._afterInventoryChange('Shield equipped');
            return;
        }

        this.context.inventory.equipArmor(item.instanceId);
        this._afterInventoryChange('Armor equipped');
    }

    _unequipSelected() {
        const item = this._selectedItem;
        if (!item) {
            return;
        }

        const swords = this.context.state.inventory.equippedSwords;
        const shield = this.context.state.inventory.equippedShield;

        let changed = false;
        for (let i = 0; i < swords.length; i++) {
            if (swords[i]?.instanceId === item.instanceId) {
                this.context.inventory.unequipSword(i);
                changed = true;
            }
        }
        if (shield?.instanceId === item.instanceId) {
            this.context.inventory.unequipShield();
            changed = true;
        }
        const armor = this.context.state.inventory.equippedArmor;
        if (armor?.instanceId === item.instanceId) {
            this.context.inventory.unequipArmor();
            changed = true;
        }

        this._afterInventoryChange(changed ? 'Item unequipped' : 'Item is not equipped');
    }

    _afterInventoryChange(message) {
        this._rebuildItemButtons();
        this._syncActionButtons();
        this._showMessage(message);
    }

    _syncActionButtons() {
        this._rebuildItemButtons();
        const item = this._selectedItem;
        const isSword = item?.type === 'sword';
        const isShield = item?.type === 'shield';
        const isArmor = item?.type === 'armor';
        const isConsumable = item?.type === 'consumable';
        const isEquipped = item ? this.context.inventory.isEquipped(item.instanceId) : false;

        this.actionButtons[0].disabled = !isConsumable;
        this.actionButtons[1].disabled = !isSword;
        this.actionButtons[2].disabled = !isSword;
        this.actionButtons[3].disabled = !(isShield || isArmor);
        this.actionButtons[3].label = isArmor ? 'ARMOR' : 'SHIELD';
        this.actionButtons[4].disabled = !isEquipped;
        this.actionButtons[5].disabled = false;
    }

    _syncActionFocus() {
        this.actionButtons.forEach((button, index) => {
            button.focused = index === this._actionFocusIndex;
        });
    }

    handleInput(input) {
        if (input.isActionPressed('cancel')) {
            this.context.scenes.pop();
            return;
        }

        if (input.isActionPressed('moveUp') && this._items.length > 0) {
            this._selectedIndex = (this._selectedIndex - 1 + this._items.length) % this._items.length;
            this._syncActionButtons();
        }
        if (input.isActionPressed('moveDown') && this._items.length > 0) {
            this._selectedIndex = (this._selectedIndex + 1) % this._items.length;
            this._syncActionButtons();
        }
        if (input.isActionPressed('moveLeft')) {
            this._actionFocusIndex = (this._actionFocusIndex - 1 + this.actionButtons.length) % this.actionButtons.length;
            this._syncActionFocus();
        }
        if (input.isActionPressed('moveRight')) {
            this._actionFocusIndex = (this._actionFocusIndex + 1) % this.actionButtons.length;
            this._syncActionFocus();
        }
        if (input.isActionPressed('confirm')) {
            this.actionButtons[this._actionFocusIndex].activate();
        }

        const pointer = input.getPointerPos();
        for (const button of this.itemButtons) {
            button.updatePointer(pointer);
            if (button.hovered && input.isPointerClicked()) {
                button.activate();
            }
        }
        for (const button of this.actionButtons) {
            button.updatePointer(pointer);
            if (button.hovered && input.isPointerClicked()) {
                button.activate();
            }
        }
    }

    update(dt) {
        for (const button of this.itemButtons) {
            button.update(dt);
        }
        for (const button of this.actionButtons) {
            button.update(dt);
        }
        if (this._messageTimer > 0) {
            this._messageTimer -= dt;
        }
    }

    render(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(8, 10, 16, 0.96)';
        ctx.fillRect(16, 12, 288, 164);
        ctx.strokeStyle = '#6f7b8a';
        ctx.strokeRect(16.5, 12.5, 287, 163);

        PixelText.draw(ctx, 'INVENTORY', 28, 20, { color: '#fff', weight: 'bold' });
        PixelText.draw(ctx, this._items.length > 0 ? `Items ${this._selectedIndex + 1}/${this._items.length}` : 'Inventory empty', 28, 34, { color: '#9db2c5' });

        for (const button of this.itemButtons) {
            button.draw(ctx);
        }
        for (const button of this.actionButtons) {
            button.draw(ctx);
        }

        this._drawScrollHints(ctx);
        this._drawEquipmentSummary(ctx);
        this._drawSelectedItemDetails(ctx);

        if (this._messageTimer > 0) {
            PixelText.draw(ctx, PixelText.fitText(ctx, this._message, 180, { size: 8 }), 160, 168, { align: 'center', color: '#ffd56a' });
        }
        ctx.restore();
    }

    _drawScrollHints(ctx) {
        if (this._scrollOffset > 0) {
            PixelText.draw(ctx, '^', LIST_X + LIST_W - 10, LIST_Y - 10, { color: '#9db2c5' });
        }
        if (this._scrollOffset + VISIBLE_ROWS < this._items.length) {
            PixelText.draw(ctx, 'v', LIST_X + LIST_W - 10, LIST_Y + VISIBLE_ROWS * ROW_H - 2, { color: '#9db2c5' });
        }
    }

    _drawEquipmentSummary(ctx) {
        const inv = this.context.state.inventory;
        const swordA = inv.equippedSwords[0] ? SWORD_DEFS[inv.equippedSwords[0].defId] : null;
        const swordB = inv.equippedSwords[1] ? SWORD_DEFS[inv.equippedSwords[1].defId] : null;
        const shield = inv.equippedShield ? SHIELD_DEFS[inv.equippedShield.defId] : null;
        const armor = inv.equippedArmor ? ARMOR_DEFS[inv.equippedArmor.defId] : null;

        PixelText.draw(ctx, 'EQUIPPED', DETAIL_X, 34, { color: '#8fd3ff' });
        PixelText.draw(ctx, PixelText.fitText(ctx, `S1 ${swordA ? swordA.name : '--'}`, 112, { size: 8 }), DETAIL_X, 46, { color: '#fff' });
        PixelText.draw(ctx, PixelText.fitText(ctx, `S2 ${swordB ? swordB.name : '--'}`, 112, { size: 8 }), DETAIL_X, 56, { color: '#fff' });
        PixelText.draw(ctx, PixelText.fitText(ctx, armor ? `AR ${armor.name} +${armor.maxHpBonus}` : 'AR --', 112, { size: 8 }), DETAIL_X, 66, { color: '#fff' });
        PixelText.draw(
            ctx,
            PixelText.fitText(ctx, shield ? `SH ${shield.name} ${inv.equippedShield.currentDurability}/${shield.maxDurability}` : 'SH --', 112, { size: 8 }),
            DETAIL_X,
            76,
            { color: '#fff' },
        );
    }

    _drawSelectedItemDetails(ctx) {
        const item = this._selectedItem;
        if (!item) {
            PixelText.draw(ctx, 'No item selected', DETAIL_X, 84, { color: '#9db2c5' });
            return;
        }

        if (item.type === 'sword') {
            const def = SWORD_DEFS[item.defId];
            PixelText.draw(ctx, def.name, DETAIL_X, 84, { color: '#8fd3ff' });
            PixelText.draw(ctx, `DMG ${def.damage}`, DETAIL_X, 96, { color: '#fff' });
            PixelText.draw(ctx, `SPD ${def.barSpeed.toFixed(1)}`, DETAIL_X + 56, 96, { color: '#fff' });
            PixelText.draw(ctx, `HITS ${def.barCount}`, DETAIL_X, 106, { color: '#fff' });
            PixelText.drawParagraph(ctx, def.description || '', DETAIL_X, 118, {
                color: '#c9d6df',
                maxWidth: 114,
                lineHeight: 9,
                maxLines: 4,
            });
            return;
        }

        if (item.type === 'shield') {
            const def = SHIELD_DEFS[item.defId];
            PixelText.draw(ctx, def.name, DETAIL_X, 84, { color: '#8fd3ff' });
            PixelText.draw(ctx, `RED ${Math.round(def.reductionPercent * 100)}%`, DETAIL_X, 96, { color: '#fff' });
            PixelText.draw(ctx, `DUR ${item.currentDurability}/${def.maxDurability}`, DETAIL_X + 56, 96, { color: '#fff' });
            PixelText.draw(ctx, item.currentDurability > 0 ? 'READY TO BLOCK' : 'BROKEN', DETAIL_X, 106, {
                color: item.currentDurability > 0 ? '#fff' : '#ff8a6a',
            });
            PixelText.drawParagraph(ctx, def.description || '', DETAIL_X, 118, {
                color: '#c9d6df',
                maxWidth: 114,
                lineHeight: 9,
                maxLines: 4,
            });
            return;
        }

        if (item.type === 'armor') {
            const def = ARMOR_DEFS[item.defId];
            PixelText.draw(ctx, def.name, DETAIL_X, 84, { color: '#8fd3ff' });
            PixelText.draw(ctx, `HP +${def.maxHpBonus}`, DETAIL_X, 96, { color: '#fff' });
            PixelText.draw(ctx, `RES ${Math.round((def.freezeResist || 0) * 100)}%`, DETAIL_X + 56, 96, { color: '#fff' });
            PixelText.draw(ctx, 'Passive defense gear', DETAIL_X, 106, { color: '#fff' });
            PixelText.drawParagraph(ctx, def.description || '', DETAIL_X, 118, {
                color: '#c9d6df',
                maxWidth: 114,
                lineHeight: 9,
                maxLines: 4,
            });
            return;
        }

        const def = CONSUMABLE_DEFS[item.defId];
        PixelText.draw(ctx, def.name, DETAIL_X, 84, { color: '#8fd3ff' });
        PixelText.draw(ctx, `HEAL ${def.healAmount}`, DETAIL_X, 96, { color: '#fff' });
        PixelText.draw(ctx, 'Single use', DETAIL_X + 56, 96, { color: '#fff' });
        PixelText.draw(ctx, 'Use from bag or in battle', DETAIL_X, 106, { color: '#fff' });
        PixelText.drawParagraph(ctx, def.description || '', DETAIL_X, 118, {
            color: '#c9d6df',
            maxWidth: 114,
            lineHeight: 9,
            maxLines: 4,
        });
    }
}
