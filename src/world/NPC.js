import { Entity } from './Entity.js';

export class NPC extends Entity {
    constructor(x, y, def) {
        super(x, y, 14, 14);
        this.def = def;
        this.npcDefId = def.id;
        this.dialogueId = def.dialogueId;
        this.interactRadius = 24;

        this._playerInRange = false;
        this._promptBlink = 0;
    }

    isPlayerInRange(playerPos) {
        const dx = playerPos.x - this.position.x;
        const dy = playerPos.y - this.position.y;
        return Math.sqrt(dx * dx + dy * dy) < this.interactRadius;
    }

    canInteract() {
        return this.active && this._playerInRange;
    }

    update(dt, playerPos) {
        if (playerPos) {
            this._playerInRange = this.isPlayerInRange(playerPos);
        }
        this._promptBlink += dt;
    }

    render(ctx, camera) {
        const screen = camera.worldToScreen(this.position.x, this.position.y);
        const hw = this.size.w / 2;
        const hh = this.size.h / 2;

        if (this.animator) {
            this.animator.draw(ctx, screen.x, screen.y);
        } else {
            // Green square body
            ctx.fillStyle = '#4a4';
            ctx.fillRect(screen.x - hw, screen.y - hh, this.size.w, this.size.h);

            // Eyes
            ctx.fillStyle = '#fff';
            ctx.fillRect(screen.x - 4, screen.y - 3, 3, 3);
            ctx.fillRect(screen.x + 2, screen.y - 3, 3, 3);

            // Pupils
            ctx.fillStyle = '#222';
            ctx.fillRect(screen.x - 3, screen.y - 2, 1, 1);
            ctx.fillRect(screen.x + 3, screen.y - 2, 1, 1);

            // Mouth
            ctx.fillStyle = '#222';
            ctx.fillRect(screen.x - 2, screen.y + 3, 5, 1);
        }

        // "E" interact prompt above head
        if (this._playerInRange) {
            const alpha = (Math.sin(this._promptBlink * 4) + 1) / 2;
            const ex = Math.round(screen.x);
            const ey = Math.round(screen.y - hh - 12);

            // Background bubble
            ctx.fillStyle = `rgba(0, 0, 0, ${0.5 + alpha * 0.3})`;
            ctx.fillRect(ex - 5, ey - 2, 10, 10);

            // "E" text
            ctx.fillStyle = `rgba(255, 255, 255, ${0.6 + alpha * 0.4})`;
            ctx.font = '7px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('E', ex, ey + 3);
            ctx.textAlign = 'left';
        }
    }
}
