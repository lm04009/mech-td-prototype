export class Projectile {
    /**
     * @param {number} x - Spawn world X
     * @param {number} y - Spawn world Y
     * @param {number} angle - Direction in radians
     * @param {number} speed - Speed in pixels/sec
     * @param {number} range - Max travel distance in pixels
     * @param {string} faction - 'PLAYER' or 'ENEMY'
     * @param {number} attackStat - Attacker's Attack stat (for damage formula)
     * @param {number} accuracyRatio - Combined accuracy (10000-scale, for hit roll)
     */
    constructor(x, y, angle, speed, range, faction, attackStat, accuracyRatio) {
        this.x = x;
        this.y = y;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.faction = faction;

        // Combat stats — resolved at collision time by CombatSystem
        this.attackStat = attackStat ?? 10;
        this.accuracyRatio = accuracyRatio ?? 9000;

        this.spawnX = x;
        this.spawnY = y;
        this.range = range;
        this.markedForDeletion = false;
        this.distanceTraveled = 0;

        this.size = 4;
        this.color = '#ffff00';
    }

    update(dt, map) {
        const dx = this.vx * dt;
        const dy = this.vy * dt;
        const nextX = this.x + dx;
        const nextY = this.y + dy;

        // Wall collision
        if (map && map.isSolid(nextX, nextY)) {
            this.markedForDeletion = true;
            return;
        }

        this.x = nextX;
        this.y = nextY;

        this.distanceTraveled += Math.sqrt(dx * dx + dy * dy);
        if (this.distanceTraveled >= this.range) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}
