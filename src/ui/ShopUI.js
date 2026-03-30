import { SceneType } from '../core/SceneManager.js';
import { Button } from './Button.js';
import { PixelText } from '../rendering/PixelText.js';
import { SHOP_DEFS } from '../data/shops.js';
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

export class ShopUI {
    constructor(context, shopId, options = {}) {
        this.type = SceneType.MODAL_OVERLAY;
        this.context = context;
        this.returnContext = options.returnContext || 'exploration';
        this.shop = SHOP_DEFS[shopId];
        this._selectedIndex = 0;
        this._scrollOffset = 0;
        this._focusIndex = 0;
        this._message = '';
        this._messageTimer = 0;

        this.itemButtons = [];
        this.actionButtons = [
            new Button(166, 146, 42, 14, 'BUY', () => this._buySelected()),
            new Button(214, 146, 42, 14, 'FIX', () => this._repairEquippedShield()),
            new Button(262, 146, 42, 14, 'BACK', () => this.context.scenes.pop()),
        ];

        this._rebuildItemButtons();
        this._syncButtons();
    }

    onEnter() {
        this.context.input.setContext('menu');
    }

    onExit() {
        this.context.input.setContext(this.returnContext);
    }

    get _stock() {
        return this.shop?.items || [];
    }

    get _selectedEntry() {
        if (this._stock.length === 0) {
            return null;
        }
        this._selectedIndex = Math.max(0, Math.min(this._selectedIndex, this._stock.length - 1));
        return this._stock[this._selectedIndex];
    }

    _showMessage(text) {
        this._message = text;
        this._messageTimer = 1.4;
    }

    _ensureSelectionVisible() {
        const maxOffset = Math.max(0, this._stock.length - VISIBLE_ROWS);
        if (this._selectedIndex < this._scrollOffset) {
            this._scrollOffset = this._selectedIndex;
        }
        if (this._selectedIndex >= this._scrollOffset + VISIBLE_ROWS) {
            this._scrollOffset = this._selectedIndex - VISIBLE_ROWS + 1;
        }
        this._scrollOffset = Math.max(0, Math.min(this._scrollOffset, maxOffset));
    }

    _rebuildItemButtons() {
        this._ensureSelectionVisible();
        const visible = this._stock.slice(this._scrollOffset, this._scrollOffset + VISIBLE_ROWS);
        this.itemButtons = visible.map((entry, offset) => {
            const index = this._scrollOffset + offset;
            const def = this._getDef(entry);
            const label = `${def?.name || entry.defId} ${def?.price || 0}g`;
            const button = new Button(LIST_X, LIST_Y + offset * ROW_H, LIST_W, 14, label, () => {
                this._selectedIndex = index;
                this._syncButtons();
            });
            button.focused = index === this._selectedIndex;
            return button;
        });
    }

    _getDef(entry) {
        if (entry?.type === 'shield') return SHIELD_DEFS[entry.defId];
        if (entry?.type === 'armor') return ARMOR_DEFS[entry.defId];
        if (entry?.type === 'consumable') return CONSUMABLE_DEFS[entry.defId];
        return SWORD_DEFS[entry?.defId];
    }

    _getOwnedCount(entry) {
        return this.context.state.inventory.items.filter((item) => item.defId === entry.defId).length;
    }

    _getRepairTarget() {
        const shield = this.context.state.player.equippedShield;
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
            missing: Math.max(0, shieldDef.maxDurability - shield.currentDurability),
        };
    }

    _getRepairCost() {
        const target = this._getRepairTarget();
        if (!target || target.missing <= 0) {
            return 0;
        }

        return target.missing * (4 + (target.shieldDef.flatReduction || 0));
    }

    _canBuySelected() {
        const entry = this._selectedEntry;
        const def = this._getDef(entry);
        if (!entry || !def) {
            return false;
        }
        if (this.context.state.inventory.items.length >= this.context.state.inventory.capacity) {
            return false;
        }
        return this.context.state.player.gold >= (def.price || 0);
    }

    _buySelected() {
        const entry = this._selectedEntry;
        const def = this._getDef(entry);
        if (!entry || !def) {
            return;
        }
        if (this.context.state.inventory.items.length >= this.context.state.inventory.capacity) {
            this._showMessage('Inventory full');
            return;
        }
        if (this.context.state.player.gold < (def.price || 0)) {
            this._showMessage('Not enough gold');
            return;
        }

        const item = this.context.inventory.addItem(entry.defId, entry.type);
        if (!item) {
            this._showMessage('Cannot carry more');
            return;
        }

        this.context.state.player.gold -= def.price || 0;
        this._syncButtons();
        this.context.audio.playSFX('loot');
        this._showMessage(`${def.name} purchased`);
    }

    _repairEquippedShield() {
        const target = this._getRepairTarget();
        if (!target) {
            this._showMessage('No shield equipped');
            return;
        }
        if (target.missing <= 0) {
            this._showMessage('Shield already intact');
            return;
        }

        const cost = this._getRepairCost();
        if (this.context.state.player.gold < cost) {
            this._showMessage('Need more gold to repair');
            return;
        }

        this.context.state.player.gold -= cost;
        target.shield.currentDurability = target.shieldDef.maxDurability;
        this._syncButtons();
        this.context.audio.playSFX('block');
        this._showMessage(`${target.shieldDef.name} repaired`);
    }

    _syncButtons() {
        this._rebuildItemButtons();
        this.actionButtons[0].disabled = !this._canBuySelected();
        this.actionButtons[1].disabled = this._getRepairCost() <= 0;
        this.actionButtons[2].disabled = false;
        this.actionButtons.forEach((button, index) => {
            button.focused = index === this._focusIndex;
        });
    }

    handleInput(input) {
        if (input.isActionPressed('cancel') || input.isActionPressed('pause')) {
            this.context.scenes.pop();
            return;
        }

        if (input.isActionPressed('moveUp') && this._stock.length > 0) {
            this._selectedIndex = (this._selectedIndex - 1 + this._stock.length) % this._stock.length;
            this._syncButtons();
        }
        if (input.isActionPressed('moveDown') && this._stock.length > 0) {
            this._selectedIndex = (this._selectedIndex + 1) % this._stock.length;
            this._syncButtons();
        }
        if (input.isActionPressed('moveLeft')) {
            this._focusIndex = (this._focusIndex - 1 + this.actionButtons.length) % this.actionButtons.length;
            this._syncButtons();
        }
        if (input.isActionPressed('moveRight')) {
            this._focusIndex = (this._focusIndex + 1) % this.actionButtons.length;
            this._syncButtons();
        }
        if (input.isActionPressed('confirm')) {
            this.actionButtons[this._focusIndex].activate();
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
        ctx.fillRect(16, 12, 288, 156);
        ctx.strokeStyle = '#6f7b8a';
        ctx.strokeRect(16.5, 12.5, 287, 155);

        PixelText.draw(ctx, this.shop?.name || 'SHOP', 28, 20, { color: '#fff', weight: 'bold' });
        PixelText.draw(ctx, `Gold ${this.context.state.player.gold}`, 292, 20, { color: '#ffd56a', align: 'right' });

        for (const button of this.itemButtons) {
            button.draw(ctx);
        }
        for (const button of this.actionButtons) {
            button.draw(ctx);
        }

        if (this._scrollOffset > 0) {
            PixelText.draw(ctx, '^', LIST_X + LIST_W - 10, LIST_Y - 10, { color: '#9db2c5' });
        }
        if (this._scrollOffset + VISIBLE_ROWS < this._stock.length) {
            PixelText.draw(ctx, 'v', LIST_X + LIST_W - 10, LIST_Y + VISIBLE_ROWS * ROW_H - 2, { color: '#9db2c5' });
        }

        this._drawSelectedDetails(ctx);

        if (this._messageTimer > 0) {
            PixelText.draw(ctx, PixelText.fitText(ctx, this._message, 180, { size: 8 }), 160, 160, {
                align: 'center',
                color: '#ffd56a',
            });
        }
        ctx.restore();
    }

    _drawSelectedDetails(ctx) {
        const entry = this._selectedEntry;
        const def = this._getDef(entry);
        if (!entry || !def) {
            PixelText.draw(ctx, 'No stock available', DETAIL_X, 54, { color: '#9db2c5' });
            return;
        }

        PixelText.draw(ctx, PixelText.fitText(ctx, def.name, 112, { size: 8 }), DETAIL_X, 42, { color: '#8fd3ff' });
        PixelText.draw(ctx, `${def.price || 0} gold`, DETAIL_X, 54, { color: '#ffd56a' });
        PixelText.draw(ctx, `Owned ${this._getOwnedCount(entry)}`, DETAIL_X + 64, 54, { color: '#fff' });

        if (entry.type === 'sword') {
            PixelText.draw(ctx, `DMG ${def.damage}`, DETAIL_X, 70, { color: '#fff' });
            PixelText.draw(ctx, `SPD ${def.barSpeed.toFixed(1)}`, DETAIL_X + 56, 70, { color: '#fff' });
            PixelText.draw(ctx, `HITS ${def.barCount}`, DETAIL_X, 82, { color: '#fff' });
        } else if (entry.type === 'shield') {
            PixelText.draw(ctx, `RED ${Math.round(def.reductionPercent * 100)}%`, DETAIL_X, 70, { color: '#fff' });
            PixelText.draw(ctx, `DUR ${def.maxDurability}`, DETAIL_X + 56, 70, { color: '#fff' });
            PixelText.draw(ctx, `FLAT ${def.flatReduction || 0}`, DETAIL_X, 82, { color: '#fff' });
        } else if (entry.type === 'armor') {
            PixelText.draw(ctx, `HP +${def.maxHpBonus}`, DETAIL_X, 70, { color: '#fff' });
            PixelText.draw(ctx, `RES ${Math.round((def.freezeResist || 0) * 100)}%`, DETAIL_X + 56, 70, { color: '#fff' });
            PixelText.draw(ctx, 'Passive defense gear', DETAIL_X, 82, { color: '#fff' });
        } else {
            PixelText.draw(ctx, `HEAL ${def.healAmount}`, DETAIL_X, 70, { color: '#fff' });
            PixelText.draw(ctx, 'ONE USE', DETAIL_X + 56, 70, { color: '#fff' });
            PixelText.draw(ctx, 'Best before hard fights', DETAIL_X, 82, { color: '#fff' });
        }

        PixelText.drawParagraph(ctx, def.description || '', DETAIL_X, 94, {
            color: '#c9d6df',
            maxWidth: 114,
            lineHeight: 9,
            maxLines: 3,
        });

        const repairTarget = this._getRepairTarget();
        if (!repairTarget) {
            PixelText.draw(ctx, 'Equip a shield for repair', DETAIL_X, 126, { color: '#9db2c5' });
            return;
        }

        const repairName = PixelText.fitText(ctx, repairTarget.shieldDef.name, 70, { size: 8 });
        PixelText.draw(ctx, `Shield ${repairName}`, DETAIL_X, 126, { color: '#fff' });
        PixelText.draw(
            ctx,
            `${repairTarget.shield.currentDurability}/${repairTarget.shieldDef.maxDurability}`,
            DETAIL_X + 114,
            126,
            { color: '#fff', align: 'right' },
        );

        const repairCost = this._getRepairCost();
        PixelText.draw(
            ctx,
            repairCost > 0 ? `Fix cost ${repairCost}g` : 'Shield at full durability',
            DETAIL_X,
            136,
            { color: repairCost > 0 ? '#ffd56a' : '#8fd3ff' },
        );
    }
}
