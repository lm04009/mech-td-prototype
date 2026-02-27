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

        // Missile arc rendering (set externally for MissileLauncher-type projectiles)
        this.isMissile = false;
    }

    update(dt, map) {
        const dx = this.vx * dt;
        const dy = this.vy * dt;
        const nextX = this.x + dx;
        const nextY = this.y + dy;

        // Wall collision — missiles arc over terrain, so skip for them
        if (!this.isMissile && map && map.isSolid(nextX, nextY)) {
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
        if (this.isMissile) {
            this._drawArc(ctx);
        } else {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * Arc/ballistic draw — top-down altitude convention:
     * - Shadow stays at the GROUND position (this.x, this.y)
     * - Missile body is drawn UPWARD on screen by altitude offset
     *   (negative Y = "up" in screen space, universally reads as flying overhead)
     * - Scale: 1.0 at launch → shrinks to 0.25 at max altitude → 1.0 at impact
     *   (missile looks tiny when far above, large when bearing down on target)
     */
    _drawArc(ctx) {
        const arcProgress = this.range > 0
            ? Math.min(1, this.distanceTraveled / this.range)
            : 1;

        // Altitude: sine peak at mid-arc (0 at launch and impact)
        const maxAltitude = 28; // px — screen-upward offset at peak
        const altitude = Math.sin(arcProgress * Math.PI) * maxAltitude;

        // Scale: inverse bell — full size at ground, smallest at apex
        const scale = 1.0 - 0.75 * Math.sin(arcProgress * Math.PI);
        // Ranges: 1.0 (launch) → 0.25 (apex) → 1.0 (impact)

        const missileX = this.x;
        const missileY = this.y - altitude; // Body floats above shadow

        // --- Shadow (ground-level, fixed small size, darkens as missile descends) ---
        ctx.save();
        ctx.globalAlpha = 0.2 + 0.55 * arcProgress;
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // --- Exhaust trail (behind missile in travel direction) ---
        const angle = Math.atan2(this.vy, this.vx);
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = '#ff4400';
        ctx.beginPath();
        ctx.arc(
            missileX - Math.cos(angle) * 5 * scale,
            missileY - Math.sin(angle) * 5 * scale,
            2.5 * scale, 0, Math.PI * 2
        );
        ctx.fill();
        ctx.restore();

        // --- Missile body ---
        ctx.save();
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(missileX, missileY, this.size * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
