import { CONFIG } from './Config.js';

export class Enemy {
    constructor(path, type = 'BASIC') {
        this.path = path;
        this.waypointIndex = 0;
        this.x = path[0].x;
        this.y = path[0].y;
        this.faction = CONFIG.FACTION.ENEMY;

        // Stats based on Type
        if (type === 'BASIC') {
            this.hp = 50; // Increased to 50 (2 shots from 25dmg tower)
            this.maxHp = 50;
            this.speed = 50;
            this.damage = 10;
            this.attackCooldown = 1.0;
            this.attackRange = 50; // Increased to 50 to cover Collision
            this.color = '#ff0000';
            this.bounty = 25;
        } else {
            // Default Fallback
            this.hp = 50;
            this.maxHp = 50;
            this.speed = 50;
            this.damage = 10;
            this.attackCooldown = 1.0;
            this.attackRange = 50;
            this.color = '#ff0000';
            this.bounty = 25;
        }

        this.attackTimer = 0;
        this.size = 30; // Radius approx 15
        this.markedForDeletion = false;
        this.reachedEnd = false;
    }

    update(dt, allEnemies, potentialTargets) {
        if (this.markedForDeletion) return;

        if (this.attackTimer > 0) {
            this.attackTimer -= dt;
        }

        // 1. Attack Logic
        if (potentialTargets) {
            for (const target of potentialTargets) {
                if (target.hp <= 0) continue;

                const dx = target.x - this.x;
                const dy = target.y - this.y;
                const distSq = dx * dx + dy * dy;
                const rangeSq = this.attackRange * this.attackRange;

                if (distSq <= rangeSq) {
                    if (this.attackTimer <= 0) {
                        target.takeDamage(this.damage);
                        this.attackTimer = this.attackCooldown;
                    }
                    break;
                }
            }
        }

        // 2. Movement Logic (Queueing / Hard Collision)
        let isBlocked = false;

        // A. Check Blocked by Targets (Mech/Terminal)
        if (potentialTargets) {
            for (const target of potentialTargets) {
                if (target.hp <= 0) continue;

                const dx = target.x - this.x;
                const dy = target.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // My Radius (15) + Target Radius (approx 15-30) + Buffer
                const collisionRadius = (this.size / 2) + (target.size ? target.size / 2 : 20);

                if (dist < collisionRadius) {
                    isBlocked = true;
                    break;
                }
            }
        }

        // B. Check Blocked by Other Enemies (Queueing)
        // Only check if not already blocked by a wall/mech
        if (!isBlocked && allEnemies) {
            for (const other of allEnemies) {
                if (other === this) continue;

                const dx = other.x - this.x;
                const dy = other.y - this.y;
                const distSq = dx * dx + dy * dy;
                const minSeparation = this.size; // Hard radius of 30px

                if (distSq < minSeparation * minSeparation) {
                    // Overlap detected. Who yields?
                    // In Blight, the one "behind" yields.
                    // Simple heuristic: If same waypoint index, rely on array index (Edge Case 1: Head-on).
                    // If different, the one with lower index (earlier in path) is usually "behind" if logic is 'index 0 is start'.
                    // Wait, index increases as they move. So HIGHER index is ahead.

                    // Actually, simpler:
                    // If 'other' is further along the path, I stop.
                    // If we are identical progress, use ID/Array index to break tie.

                    let otherIsAhead = false;

                    if (other.waypointIndex > this.waypointIndex) {
                        otherIsAhead = true;
                    } else if (other.waypointIndex === this.waypointIndex) {
                        // Same waypoint segment. Who is closer to it?
                        const dMe = this.distToWaypoint();
                        const dOther = other.distToWaypoint();

                        // Smaller distance to next waypoint == Closer == Ahead.
                        if (dOther < dMe) {
                            otherIsAhead = true;
                        } else if (Math.abs(dOther - dMe) < 1) {
                            // Approximately equal (Head-on spawn).
                            // Tiebreaker: Arbitrary stability based on position in array
                            // We need a stable order.
                            // If my index > other index, I yield? 
                            // Let's say higher index yields.
                            // We don't have indexes passed here easily.
                            // Assume 'allEnemies' order is stable.
                            // We can just rely on distance check mostly.
                            // If exactly zero:
                            if (distSq === 0) {
                                // Force yield if I am 'second' effectively
                                // Random fallback for v0
                                isBlocked = true;
                                break;
                            }
                        }
                    }

                    if (otherIsAhead) {
                        isBlocked = true;
                        break;
                    }
                }
            }
        }

        // Move if not blocked
        if (!isBlocked) {
            this.followPath(dt);
        }
    }

    distToWaypoint() {
        // Distance to *current* target waypoint
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

    // ... draw/takeDamage ...  
    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);

        // HP Bar
        const hpPct = this.hp / 50;
        ctx.fillStyle = '#0f0';
        ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2 - 5, this.size * hpPct, 3);
    }
}
