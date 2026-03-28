import { SceneType } from '../core/SceneManager.js';
import { PixelText } from '../rendering/PixelText.js';
import { SWORD_DEFS } from '../data/swords.js';
import { SHIELD_DEFS } from '../data/shields.js';

export class HUD {
    constructor(context) {
        this.type = SceneType.NON_MODAL_OVERLAY;
        this.context = context;
    }

    update() {}

    render(ctx) {
        const player = this.context.state.player;
        const swordA = player.equippedSwords[0] ? SWORD_DEFS[player.equippedSwords[0].defId] : null;
        const swordB = player.equippedSwords[1] ? SWORD_DEFS[player.equippedSwords[1].defId] : null;
        const shieldDef = player.equippedShield ? SHIELD_DEFS[player.equippedShield.defId] : null;

        ctx.save();
        ctx.fillStyle = 'rgba(8, 12, 20, 0.76)';
        ctx.fillRect(6, 6, 140, 42);
        ctx.fillRect(152, 6, 162, 42);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.strokeRect(6.5, 6.5, 139, 41);
        ctx.strokeRect(152.5, 6.5, 161, 41);

        PixelText.draw(ctx, 'HP', 12, 11, { color: '#fff' });
        this._drawMeter(ctx, 28, 10, 70, 8, player.hp, player.maxHp, '#52c35a');
        PixelText.draw(ctx, `${player.hp}/${player.maxHp}`, 136, 11, { color: '#fff', align: 'right' });

        PixelText.draw(ctx, 'SOUL', 12, 23, { color: '#fff' });
        this._drawMeter(ctx, 40, 22, 58, 6, player.soulIntegrity, 100, '#4ac0ff');
        PixelText.draw(ctx, `${player.soulIntegrity}`, 136, 21, { color: '#fff', align: 'right' });

        PixelText.draw(ctx, `G ${player.gold}`, 12, 33, { color: '#ffd56a' });

        PixelText.draw(ctx, this._fitLine(ctx, `S1 ${swordA ? swordA.name : '--'}`, 150), 158, 11, { color: '#fff' });
        PixelText.draw(ctx, this._fitLine(ctx, `S2 ${swordB ? swordB.name : '--'}`, 150), 158, 21, { color: '#fff' });
        const shieldText = shieldDef
            ? `SH ${shieldDef.name} ${player.equippedShield.currentDurability}/${shieldDef.maxDurability}`
            : 'SH --';
        PixelText.draw(ctx, this._fitLine(ctx, shieldText, 150), 158, 31, { color: '#fff' });
        ctx.restore();
    }

    _fitLine(ctx, text, maxWidth) {
        return PixelText.fitText(ctx, text, maxWidth, { size: 8 });
    }

    _drawMeter(ctx, x, y, width, height, current, max, color) {
        ctx.fillStyle = '#111';
        ctx.fillRect(x, y, width, height);
        const ratio = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0;
        ctx.fillStyle = color;
        ctx.fillRect(x + 1, y + 1, (width - 2) * ratio, height - 2);
        ctx.strokeStyle = '#555';
        ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
    }
}
