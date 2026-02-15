import { Projectile } from './projectile.js';

export class Weapon {
    constructor(range, projectileSpeed, color, damage) {
        this.range = range;
        this.projectileSpeed = projectileSpeed;
        this.color = color;
        this.damage = damage || 10;

        this.cooldownTime = 0.5; // Seconds
        this.currentCooldown = 0;
    }

    update(dt) {
        if (this.currentCooldown > 0) {
            this.currentCooldown -= dt;
        }
    }

    fire(originX, originY, targetX, targetY, faction) {
        // Cooldown Check
        if (this.currentCooldown > 0) {
            return null;
        }

        // Range Check (Strict)
        const dx = targetX - originX;
        const dy = targetY - originY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > this.range) {
            // Out of range - do not fire
            return null;
        }

        // Fire
        this.currentCooldown = this.cooldownTime;
        const angle = Math.atan2(dy, dx);

        const p = new Projectile(originX, originY, angle, this.projectileSpeed, this.range, faction, this.damage); // Pass Damage
        if (faction === 'ENEMY') {
            p.color = '#ff8800'; // Orange for enemy bullets
        } else {
            p.color = this.color;
        }
        return p;
    }
}
