import { Entity } from './Entity.js';
import { PHYSICS } from '../data/constants.js';

export class Player extends Entity {
    constructor(x, y) {
        super(x, y, 10, 10);
        this.velocity = { x: 0, y: 0 };
        this.speed = PHYSICS.PLAYER_SPEED;
        this.friction = PHYSICS.PLAYER_FRICTION;
        this.direction = 'down';
        this.moving = false;

        this._moveX = 0;
        this._moveY = 0;
    }

    setMovement(mx, my) {
        this._moveX = mx;
        this._moveY = my;
    }

    update(dt, tileMap) {
        if (this._moveX !== 0 || this._moveY !== 0) {
            const len = Math.sqrt(this._moveX * this._moveX + this._moveY * this._moveY);
            this.velocity.x = (this._moveX / len) * this.speed;
            this.velocity.y = (this._moveY / len) * this.speed;
            this.moving = true;

            if (Math.abs(this._moveX) > Math.abs(this._moveY)) {
                this.direction = this._moveX > 0 ? 'right' : 'left';
            } else {
                this.direction = this._moveY > 0 ? 'down' : 'up';
            }
        } else {
            this.velocity.x *= (1 - this.friction * dt);
            this.velocity.y *= (1 - this.friction * dt);

            if (Math.abs(this.velocity.x) < 0.5) this.velocity.x = 0;
            if (Math.abs(this.velocity.y) < 0.5) this.velocity.y = 0;

            this.moving = this.velocity.x !== 0 || this.velocity.y !== 0;
        }

        const newX = this.position.x + this.velocity.x * dt;
        const newY = this.position.y + this.velocity.y * dt;

        if (tileMap) {
            if (!this._collidesAt(newX, this.position.y, tileMap)) {
                this.position.x = newX;
            } else {
                this.velocity.x = 0;
            }
            if (!this._collidesAt(this.position.x, newY, tileMap)) {
                this.position.y = newY;
            } else {
                this.velocity.y = 0;
            }
        } else {
            this.position.x = newX;
            this.position.y = newY;
        }

        if (this.animator) {
            const animName = this.moving ? `walk_${this.direction}` : `idle_${this.direction}`;
            this.animator.play(animName);
            this.animator.update(dt);
        }
    }

    _collidesAt(x, y, tileMap) {
        const hw = this.size.w / 2;
        const hh = this.size.h / 2;
        return (
            tileMap.isSolidAt(x - hw, y - hh) ||
            tileMap.isSolidAt(x + hw - 1, y - hh) ||
            tileMap.isSolidAt(x - hw, y + hh - 1) ||
            tileMap.isSolidAt(x + hw - 1, y + hh - 1)
        );
    }

    render(ctx, camera) {
        const screen = camera.worldToScreen(this.position.x, this.position.y);
        const hw = this.size.w / 2;
        const hh = this.size.h / 2;

        if (this.animator) {
            this.animator.draw(ctx, screen.x, screen.y);
            return;
        }

        // Placeholder body
        ctx.fillStyle = '#4af';
        ctx.fillRect(screen.x - hw, screen.y - hh, this.size.w, this.size.h);

        // Direction dot
        ctx.fillStyle = '#fff';
        let dx = 0, dy = 0;
        if (this.direction === 'up')    { dx = 0; dy = -hh + 1; }
        if (this.direction === 'down')  { dx = 0; dy = hh - 3; }
        if (this.direction === 'left')  { dx = -hw + 1; dy = 0; }
        if (this.direction === 'right') { dx = hw - 3; dy = 0; }
        ctx.fillRect(screen.x + dx - 1, screen.y + dy - 1, 3, 3);
    }
}
