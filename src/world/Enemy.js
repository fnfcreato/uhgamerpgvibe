import { Entity } from './Entity.js';

export class Enemy extends Entity {
    constructor(x, y, def, spawnId) {
        super(x, y, 12, 12);
        this.def = def;
        this.spawnId = spawnId;
        this.alertRadius = def.detectionRadius || 40;
        this.battleRadius = 16;
        this.chaseSpeed = 30;

        this.alerted = false;
        this._alertTimer = 0;
        this._alertShowTime = 0.5;
        this._exclamationY = 0;
    }

    isPlayerInRange(playerPos) {
        const dx = playerPos.x - this.position.x;
        const dy = playerPos.y - this.position.y;
        return Math.sqrt(dx * dx + dy * dy) < this.battleRadius;
    }

    update(dt, playerPos, tileMap) {
        if (!playerPos) return;

        const dx = playerPos.x - this.position.x;
        const dy = playerPos.y - this.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.alertRadius && dist > this.battleRadius) {
            if (!this.alerted) {
                this.alerted = true;
                this._alertTimer = 0;
                this._exclamationY = -2;
            }
            this._alertTimer += dt;

            // Chase player
            const nx = dx / dist;
            const ny = dy / dist;
            const newX = this.position.x + nx * this.chaseSpeed * dt;
            const newY = this.position.y + ny * this.chaseSpeed * dt;

            if (tileMap) {
                const hw = this.size.w / 2;
                const hh = this.size.h / 2;
                if (!tileMap.isSolidAt(newX - hw, newY - hh) &&
                    !tileMap.isSolidAt(newX + hw - 1, newY - hh) &&
                    !tileMap.isSolidAt(newX - hw, newY + hh - 1) &&
                    !tileMap.isSolidAt(newX + hw - 1, newY + hh - 1)) {
                    this.position.x = newX;
                    this.position.y = newY;
                }
            } else {
                this.position.x = newX;
                this.position.y = newY;
            }
        } else if (dist >= this.alertRadius) {
            this.alerted = false;
        }

        // Bounce the "!" mark
        if (this.alerted && this._alertTimer < this._alertShowTime) {
            this._exclamationY = -2 + Math.sin(this._alertTimer * 20) * 2;
        }

        if (this.animator) {
            this.animator.update(dt);
        }
    }

    render(ctx, camera) {
        const screen = camera.worldToScreen(this.position.x, this.position.y);
        const hw = this.size.w / 2;
        const hh = this.size.h / 2;

        if (this.animator) {
            this.animator.draw(ctx, screen.x, screen.y);
        } else {
            ctx.fillStyle = '#e44';
            ctx.fillRect(screen.x - hw, screen.y - hh, this.size.w, this.size.h);

            ctx.fillStyle = '#fff';
            ctx.fillRect(screen.x - 3, screen.y - 2, 2, 2);
            ctx.fillRect(screen.x + 2, screen.y - 2, 2, 2);
        }

        // Pixelated "!" sign
        if (this.alerted) {
            const ex = Math.round(screen.x);
            const ey = Math.round(screen.y - hh - 10 + this._exclamationY);

            // Background bubble
            ctx.fillStyle = '#fff';
            ctx.fillRect(ex - 4, ey - 2, 8, 12);

            // "!" mark in pixels
            ctx.fillStyle = '#e22';
            ctx.fillRect(ex - 1, ey, 2, 6);
            ctx.fillRect(ex - 1, ey + 8, 2, 2);
        }
    }
}
