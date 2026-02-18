import { Weapon } from './weapon.js';
import { CONFIG } from './Config.js';
import { Collision } from '../engine/Collision.js';

export class Mech {
    constructor(x, y, eventBus) {
        this.x = x;
        this.y = y;
        this.eventBus = eventBus;
        this.speed = 200; // pixels per second
        this.size = 40;
        this.color = '#00ff00'; // Green for friendlies

        // Damageable Interface
        this.faction = CONFIG.FACTION.PLAYER;
        this.maxHp = 100;
        this.hp = this.maxHp;
        this.damageFlashTimer = 0;

        // Weapons
        this.weaponLeft = new Weapon(300, 400, '#ffff00', 15); // Medium Range, 15 Dmg
        // this.weaponRight = ...

        this.angle = 0; // Facing angle
    }

    update(dt, inputVector, mousePos, inputState, game) {
        const map = game.map;
        const entities = game.entities;

        // Damage Flash
        if (this.damageFlashTimer > 0) {
            this.damageFlashTimer -= dt;
        }

        // Movement
        if (inputVector.x !== 0 || inputVector.y !== 0) {
            let dx = inputVector.x * this.speed * dt;
            let dy = inputVector.y * this.speed * dt;

            // Iterative Collision Resolution (Slide)
            // We try to move X, resolve, then move Y, resolve? 
            // Or move combined and resolve against closest?
            // "Slide" usually means: projected move -> if hit, project onto tangent.

            // Let's use a multi-pass approach (X then Y) for stability against grid walls

            // 1. Move X
            let nextX = this.x + dx;
            let nextY = this.y; // Keep Y same

            if (this.checkCollision(nextX, nextY, game)) {
                // Collision! Stop X movement.
                // In a proper physics engine we'd slide, but for top-down grid:
                // Just zeroing dx is often enough to "slide" along a wall if Y is free.
                dx = 0;
            }
            this.x += dx;

            // 2. Move Y
            nextX = this.x; // Use new X
            nextY = this.y + dy;

            if (this.checkCollision(nextX, nextY, game)) {
                // Collision! Stop Y movement.
                dy = 0;
            }
            this.y += dy;
        }

        // Face Mouse
        if (mousePos) {
            this.angle = Math.atan2(mousePos.y - this.y, mousePos.x - this.x);
        }

        // Update Weapons
        this.weaponLeft.update(dt);

        // Fire Input
        if (inputState && inputState.isDown) {
            // Try to fire left weapon
            // Weapon mount position is slightly offset, but using center for v0 simplicity
            return this.weaponLeft.fire(this.x, this.y, mousePos.x, mousePos.y, this.faction);
        }

        return null;
    }

    checkCollision(x, y, game) {
        const map = game.map;
        const entities = game.entities;
        const radius = (this.size / 2) * 0.8; // Reduce collision radius to allow passing through 1-tile gaps

        // 1. Map Obstacles
        // Optimize: Only check nearby tiles
        // Bounding box for query
        const queryRect = {
            x: x - radius,
            y: y - radius,
            width: radius * 2,
            height: radius * 2
        };

        const obstacles = map.getObstacles(queryRect);

        // We need a helper to check Circle vs Rect list
        const myCircle = { x: x, y: y, radius: radius };

        for (const obs of obstacles) {
            if (Collision.checkCircleRect(myCircle, obs)) {
                return true;
            }
        }

        // 2. Entity Obstacles (Enemies, Terminal)
        // Enemies
        if (entities) {
            for (const enemy of entities.enemies) {
                if (enemy.hp > 0 && Collision.checkCircleCircle(myCircle, { x: enemy.x, y: enemy.y, radius: enemy.size / 2 })) {
                    return true;
                }
            }
        }

        // Terminal
        const term = game.terminal;
        if (term && term.hp > 0) {
            // Terminal is large rect?
            // Terminal.js says: width 60, height 60
            const termRect = {
                x: term.x - term.width / 2,
                y: term.y - term.height / 2,
                width: term.width,
                height: term.height
            };
            if (Collision.checkCircleRect(myCircle, termRect)) {
                return true;
            }
        }

        return false;
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp < 0) this.hp = 0;
        this.damageFlashTimer = 0.1; // Flash for 100ms

        if (this.eventBus) {
            this.eventBus.emit('mech:damage', { hp: this.hp, maxHp: this.maxHp });
        }

        return this.hp <= 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + Math.PI / 2); // Adjust so "up" is 0 degrees visual, but atan2 assumes 0 is right.

        // Draw Range Indicator (Faint)
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.2)';
        ctx.beginPath();
        ctx.arc(0, 0, this.weaponLeft.range, 0, Math.PI * 2);
        ctx.stroke();

        // Draw Legs (Darker base)
        ctx.fillStyle = '#004400';
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);

        // Draw Torso (Core)
        if (this.damageFlashTimer > 0) {
            ctx.fillStyle = '#ffffff'; // White Flash
        } else {
            ctx.fillStyle = this.color;
        }
        ctx.fillRect(-this.size / 3, -this.size / 3, this.size / 1.5, this.size / 1.5);

        // Draw Arms (Simple weapon mounts)
        ctx.fillStyle = '#00aa00';
        // Left Arm
        ctx.fillRect(-this.size / 2 - 5, -5, 10, 10);
        // Right Arm
        ctx.fillRect(this.size / 2 - 5, -5, 10, 10);

        // Direction Indicator (Yellow notch)
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(-2, -this.size / 2, 4, 8);

        ctx.restore();
    }
}
