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
        this.damageFlashTimer = 0;
        this.destructionSparks = [];

        // Parts
        this.parts = {
            body: { name: 'Body', hp: 24, maxHp: 24, defense: 8 },
            armLeft: { name: 'Arm L', hp: 19, maxHp: 19, defense: 9 },
            armRight: { name: 'Arm R', hp: 22, maxHp: 22, defense: 12 },
            legs: { name: 'Legs', hp: 20, maxHp: 20, defense: 10 }
        };

        // Weapons
        this.weaponLeft = new Weapon(300, 400, '#ffff00', 15); // Medium Range, 15 Dmg
        this.weaponLeft.mountPart = 'armLeft';
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

        // Update Destruction Sparks
        for (let i = this.destructionSparks.length - 1; i >= 0; i--) {
            this.destructionSparks[i].timer -= dt;
            if (this.destructionSparks[i].timer <= 0) {
                this.destructionSparks.splice(i, 1);
            }
        }

        // Movement
        if (inputVector.x !== 0 || inputVector.y !== 0) {
            let currentSpeed = this.speed;
            if (this.parts.legs.hp <= 0) {
                currentSpeed = Math.floor(this.speed * (5000 / 10000));
            }

            let dx = inputVector.x * currentSpeed * dt;
            let dy = inputVector.y * currentSpeed * dt;

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
            if (this.parts[this.weaponLeft.mountPart].hp > 0) {
                // Calculate actual barrel coordinates using the same rotation offset as the Canvas
                const mountOffsetX = -this.size / 2; // Left side
                const mountOffsetY = -this.size / 2; // Front edge

                // World coordinate transformation (matching ctx.rotate(this.angle + Math.PI / 2))
                const c = Math.cos(this.angle + Math.PI / 2);
                const s = Math.sin(this.angle + Math.PI / 2);

                const startX = this.x + (mountOffsetX * c - mountOffsetY * s);
                const startY = this.y + (mountOffsetX * s + mountOffsetY * c);

                return this.weaponLeft.fire(startX, startY, mousePos.x, mousePos.y, this.faction);
            }
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

    processHit(attackStat) {
        // RNG weighting: Body 1 (12.5%), armLeft 2 (25%), armRight 2 (25%), Legs 3 (37.5%)
        // Total weight = 8
        const roll = Math.random() * 8;
        let targetPart;

        if (roll < 1) targetPart = this.parts.body;
        else if (roll < 3) targetPart = this.parts.armLeft;
        else if (roll < 5) targetPart = this.parts.armRight;
        else targetPart = this.parts.legs;

        const wasDestroyedBefore = targetPart.hp <= 0;

        // Overflow: if target is already destroyed, select randomly from remaining non-destroyed parts (weight 1 each)
        if (wasDestroyedBefore) {
            const validParts = Object.values(this.parts).filter(p => p.hp > 0);
            if (validParts.length > 0) {
                const rerollIndex = Math.floor(Math.random() * validParts.length);
                targetPart = validParts[rerollIndex];
            } else {
                targetPart = this.parts.body; // Fallback entirely, game is over anyway
            }
        }

        const mitigationMultiplier = attackStat / (attackStat + targetPart.defense);
        const damage = Math.max(1, Math.round(attackStat * mitigationMultiplier));

        targetPart.hp -= damage;
        if (targetPart.hp < 0) targetPart.hp = 0;

        if (!wasDestroyedBefore && targetPart.hp === 0 && targetPart !== this.parts.body) {
            let offsetX = 0;
            let offsetY = 0;
            if (targetPart === this.parts.armLeft) { offsetX = -this.size / 2 - 5; offsetY = 0; }
            if (targetPart === this.parts.armRight) { offsetX = this.size / 2 - 5; offsetY = 0; }
            if (targetPart === this.parts.legs) { offsetX = 0; offsetY = this.size / 4; }

            this.destructionSparks.push({
                x: offsetX,
                y: offsetY,
                timer: 0.5,
                maxTimer: 0.5
            });
        }

        this.damageFlashTimer = 0.1; // Flash for 100ms

        if (this.eventBus) {
            this.eventBus.emit('mech:damage', { hp: this.parts.body.hp, maxHp: this.parts.body.maxHp, parts: this.parts });
        }

        return this.parts.body.hp <= 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + Math.PI / 2); // Adjust so "up" is 0 degrees visual, but atan2 assumes 0 is right.

        // Draw Range Indicator (Faint)
        if (this.parts[this.weaponLeft.mountPart].hp > 0) {
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.2)';
            ctx.beginPath();

            let cx = 0, cy = 0;
            if (this.weaponLeft.mountPart === 'armLeft') {
                cx = -this.size / 2;
                cy = -this.size / 2;
            } else if (this.weaponLeft.mountPart === 'armRight') {
                cx = this.size / 2;
                cy = -this.size / 2;
            }

            ctx.arc(cx, cy, this.weaponLeft.range, 0, Math.PI * 2);
            ctx.stroke();
        }

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
        // Left Arm
        if (this.parts.armLeft.hp > 0) {
            ctx.fillStyle = '#00aa00';
            ctx.fillRect(-this.size / 2 - 5, -5, 10, 10);

            // Draw Weapon
            if (this.weaponLeft && this.weaponLeft.mountPart === 'armLeft') {
                ctx.fillStyle = '#ffff00';
                ctx.fillRect(-this.size / 2 - 2, -this.size / 2, 4, 15); // Barrel pointing forward
            }
        } else {
            // Destroyed stub
            ctx.fillStyle = '#555555';
            ctx.fillRect(-this.size / 2 - 2, -3, 4, 6);
        }

        // Right Arm
        if (this.parts.armRight.hp > 0) {
            ctx.fillStyle = '#00aa00';
            ctx.fillRect(this.size / 2 - 5, -5, 10, 10);

            // Handled generically in case we add right weapons
            if (this.weaponRight && this.weaponRight.mountPart === 'armRight') {
                ctx.fillStyle = '#ffff00';
                ctx.fillRect(this.size / 2 - 2, -this.size / 2, 4, 15);
            }
        } else {
            // Destroyed stub
            ctx.fillStyle = '#555555';
            ctx.fillRect(this.size / 2 - 2, -3, 4, 6);
        }

        // Draw Destruction Sparks
        for (const spark of this.destructionSparks) {
            const progress = 1.0 - (spark.timer / spark.maxTimer);
            const r = 5 + (progress * 40); // Expanding radius
            const alpha = spark.timer / spark.maxTimer; // Fade out

            ctx.fillStyle = `rgba(255, 50, 0, ${alpha * 0.8})`;
            ctx.beginPath();
            ctx.arc(spark.x, spark.y, r, 0, Math.PI * 2);
            ctx.fill();

            // Core flash
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(spark.x, spark.y, r * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}
