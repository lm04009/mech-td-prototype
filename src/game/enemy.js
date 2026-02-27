import { CONFIG } from './Config.js';
import { Collision } from '../engine/Collision.js';
import { CombatSystem } from '../engine/CombatSystem.js';
import { Projectile } from './projectile.js';

export class Enemy {
    /**
     * @param {object[]} path - Array of {x, y} waypoints
     * @param {object} enemyData - Entry from enemies.json
     */
    constructor(path, enemyData) {
        this.path = path;
        this.waypointIndex = 0;
        this.x = path[0].x;
        this.y = path[0].y;
        this.faction = CONFIG.FACTION.ENEMY;

        // Stats from data
        this.maxHp = enemyData.HP;
        this.hp = enemyData.HP;
        this.attackStat = enemyData.Attack;
        this.defense = enemyData.Defense;
        this.accuracyRatio = enemyData.AccuracyRatio;
        this.evasion = 0; // Enemies have no evasion — simplification for v0

        // Attack range: RangeMax is in tiles → world pixels
        this.attackRange = (enemyData.RangeMax ?? 1) * CONFIG.TILE_SIZE;

        // Attack interval from formula (use RangeMax as proxy for now; TypeAttackInterval not yet in enemies.json)
        // Fall back to a sensible 1000ms default if not specified
        const baseInterval = enemyData.TypeAttackInterval ?? 1000;
        this.attackIntervalMs = CombatSystem.calcAttackInterval(baseInterval, 0, []);
        this.attackTimerMs = 0;

        this.projectilesPerRound = enemyData.ProjectilesPerRound ?? 0;

        // Visual
        this.speed = 50; // TODO: add speed to enemies.json in a future pass
        this.size = 30;
        this.color = this._colorFromEvasion();
        this.bounty = Math.ceil(enemyData.HP / 3); // Simple bounty proportional to HP

        this.markedForDeletion = false;
        this.reachedEnd = false;
    }

    _colorFromEvasion() {
        // Simple visual distinction by HP tier
        if (this.maxHp >= 50) return '#cc0000'; // Heavy — dark red
        if (this.maxHp >= 25) return '#ff4400'; // Standard — orange-red
        return '#ff8800';                        // Light — orange
    }

    update(dt, allEnemies, potentialTargets) {
        if (this.markedForDeletion) return;

        const dtMs = dt * 1000;
        if (this.attackTimerMs > 0) this.attackTimerMs -= dtMs;

        // 1. Attack Logic — returns projectile or applies direct hit
        const newProjectile = this._tryAttack(potentialTargets);

        // 2. Movement / Queuing
        let isBlocked = false;
        const myCircle = { x: this.x, y: this.y, radius: this.size / 2 };

        // Blocked by targets (Mech / Terminal)?
        if (potentialTargets) {
            for (const target of potentialTargets) {
                const isTargetDead = target.parts ? (target.parts.body.hp <= 0) : (target.hp <= 0);
                if (isTargetDead) continue;

                let isHit = false;
                if (target.width && target.height) {
                    const tRect = { x: target.x - target.width / 2, y: target.y - target.height / 2, width: target.width, height: target.height };
                    isHit = Collision.checkCircleRect(myCircle, tRect);
                } else if (target.size) {
                    isHit = Collision.checkCircleCircle(myCircle, { x: target.x, y: target.y, radius: target.size / 2 });
                }

                if (isHit) { isBlocked = true; break; }
            }
        }

        // Blocked by other enemies (queueing)?
        if (!isBlocked && allEnemies) {
            for (const other of allEnemies) {
                if (other === this) continue;
                if (Collision.checkCircleCircle(myCircle, { x: other.x, y: other.y, radius: other.size / 2 })) {
                    // Yield if other is further ahead on path
                    let otherIsAhead = false;
                    if (other.waypointIndex > this.waypointIndex) {
                        otherIsAhead = true;
                    } else if (other.waypointIndex === this.waypointIndex) {
                        const dMe = this.distToWaypoint();
                        const dOther = other.distToWaypoint();
                        if (dOther < dMe) {
                            otherIsAhead = true;
                        } else if (Math.abs(dOther - dMe) < 1) {
                            if (other.x > this.x || (other.x === this.x && other.y > this.y)) otherIsAhead = true;
                        }
                    }
                    if (otherIsAhead) { isBlocked = true; break; }
                }
            }
        }

        if (!isBlocked) this.followPath(dt);

        return newProjectile; // May be null — caller (EntityManager) handles adding it
    }

    _tryAttack(potentialTargets) {
        if (!potentialTargets || this.attackTimerMs > 0) return null;

        for (const target of potentialTargets) {
            const isTargetDead = target.parts ? (target.parts.body.hp <= 0) : (target.hp <= 0);
            if (isTargetDead) continue;

            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const distSq = dx * dx + dy * dy;

            if (distSq <= this.attackRange * this.attackRange) {
                this.attackTimerMs = this.attackIntervalMs;

                if (this.projectilesPerRound > 0) {
                    // Ranged attack — spawn projectile
                    const angle = Math.atan2(dy, dx);
                    const rangePixels = this.attackRange;
                    const p = new Projectile(
                        this.x, this.y,
                        angle,
                        300,
                        rangePixels,
                        this.faction,
                        this.attackStat,
                        this.accuracyRatio
                    );
                    p.color = '#ff8800';
                    return p;
                } else {
                    // Melee — resolve hit directly via CombatSystem
                    const result = CombatSystem.resolveHit(this.accuracyRatio, this.attackStat, target);
                    if (result.hit) {
                        if (target.parts) {
                            // Mech — part-targeted damage
                            target.applyPartDamage(result.partKey, result.damage);
                        } else if (target.takeDamage) {
                            // Terminal or other entity with takeDamage (fires eventBus)
                            target.takeDamage(result.damage);
                        } else {
                            target.hp = Math.max(0, target.hp - result.damage);
                        }
                    }
                    return null;
                }
            }
        }
        return null;
    }

    distToWaypoint() {
        const target = this.path[this.waypointIndex];
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    followPath(dt) {
        if (this.path.length === 0) return;
        const target = this.path[this.waypointIndex];
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 5) {
            const moveDist = this.speed * dt;
            this.x += (dx / dist) * moveDist;
            this.y += (dy / dist) * moveDist;
        } else {
            this.waypointIndex++;
            if (this.waypointIndex >= this.path.length) {
                this.reachedEnd = true;
            }
        }
    }

    takeDamage(damage) {
        // Simple flat damage (for terminal/tower interactions not yet formula-based)
        this.hp = Math.max(0, this.hp - damage);
        if (this.hp <= 0) this.markedForDeletion = true;
    }

    draw(ctx) {
        // Body
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);

        // HP bar
        const hpPct = this.hp / this.maxHp;
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2 - 7, this.size, 4);
        ctx.fillStyle = hpPct > 0.5 ? '#0f0' : hpPct > 0.25 ? '#ff0' : '#f00';
        ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2 - 7, this.size * hpPct, 4);
    }
}
