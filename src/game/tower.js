import { Projectile } from './projectile.js';

export class Tower {
    constructor(col, row, tileSize) {
        this.col = col;
        this.row = row;
        this.tileSize = tileSize;

        // Center Pixel Position
        this.x = col * tileSize + tileSize / 2;
        this.y = row * tileSize + tileSize / 2;

        this.range = 250;
        this.damage = 25;
        this.cooldown = 1.0; // Seconds
        this.timer = 0;

        this.angle = 0;
        this.target = null;
    }

    update(dt, enemies, map) {
        this.timer -= dt;

        // 1. Validate existing target
        if (this.target) {
            if (this.target.hp <= 0 || this.target.markedForDeletion || !this.isInRange(this.target) || !map.hasLineOfSight(this.x, this.y, this.target.x, this.target.y)) {
                this.target = null;
            }
        }

        // 2. Find new target if needed
        if (!this.target) {
            this.target = this.findTarget(enemies, map);
        }

        // 3. Track Target
        if (this.target) {
            this.angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);

            // 4. Fire
            if (this.timer <= 0) {
                this.timer = this.cooldown;
                return this.fire();
            }
        }

        return null;
    }

    findTarget(enemies, map) {
        for (const enemy of enemies) {
            if (this.isInRange(enemy) && map.hasLineOfSight(this.x, this.y, enemy.x, enemy.y)) {
                // Since enemies array is usually sorted by spawn time (oldest first), 
                // the first one we find is the one furthest ahead.
                return enemy;
            }
        }
        return null;
    }

    isInRange(enemy) {
        const dx = enemy.x - this.x;
        const dy = enemy.y - this.y;
        return (dx * dx + dy * dy) <= (this.range * this.range);
    }

    fire() {
        // Spawn Projectile
        // Muzzle position (tip of turret)
        const muzzleDist = 20;
        const mx = this.x + Math.cos(this.angle) * muzzleDist;
        const my = this.y + Math.sin(this.angle) * muzzleDist;

        // Create projectile targeting the current enemy position
        // Ideally we predict movement, but for v0 direct aim is fine.
        const speed = 400;
        const p = new Projectile(mx, my, this.angle, speed, this.range);
        p.color = '#00ffff'; // Cyan bullets
        return p;
    }

    draw(ctx) {
        // Draw Range (Debugging / Hover - maybe only check if mouse hover?)
        // ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
        // ctx.beginPath();
        // ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
        // ctx.stroke();

        ctx.save();
        ctx.translate(this.x, this.y);

        // Base (Static)
        ctx.fillStyle = '#444';
        ctx.fillRect(-15, -15, 30, 30);

        // Turret (Rotates)
        ctx.rotate(this.angle);
        ctx.fillStyle = '#00aaaa';
        ctx.fillRect(-10, -10, 20, 20); // Body
        ctx.fillRect(0, -4, 20, 8);     // Barrel

        ctx.restore();
    }
}
