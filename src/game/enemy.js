import { CONFIG } from './Config.js';
import { Collision } from '../engine/Collision.js';

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
                const isTargetDead = target.parts ? (target.parts.body.hp <= 0) : (target.hp <= 0);
                if (isTargetDead) continue;

                const dx = target.x - this.x;
                const dy = target.y - this.y;
                const distSq = dx * dx + dy * dy;
                const rangeSq = this.attackRange * this.attackRange;

                if (distSq <= rangeSq) {
                    if (this.attackTimer <= 0) {
                        if (target.processHit) {
                            target.processHit(this.damage);
                        } else {
                            target.takeDamage(this.damage);
                        }
                        this.attackTimer = this.attackCooldown;
                    }
                    break;
                }
            }
        }

        // 2. Movement Logic (Queueing / Hard Collision)
        let isBlocked = false;

        const myCircle = { x: this.x, y: this.y, radius: this.size / 2 };

        // A. Check Blocked by Targets (Mech/Terminal)
        if (potentialTargets) {
            for (const target of potentialTargets) {
                const isTargetDead = target.parts ? (target.parts.body.hp <= 0) : (target.hp <= 0);
                if (isTargetDead) continue;

                // Simple Circle Check using Helper
                // Target size? Mech has size. Terminal has width/height (Rect).
                // Let's assume Targets are circular for now (Mech) or we use specific check.
                // Terminal is Rect. Mech is Circle.
                // We need to know type or just try both?
                // For v0, let's treat everything as Circle for Enemy blockage to keep it simple & fast
                // or use the appropriate check if we can distinguish.
                // Mech has .size (Circle), Terminal has .width (Rect).

                let isHit = false;
                if (target.width && target.height) {
                    // Rect (Terminal)
                    const tRect = { x: target.x - target.width / 2, y: target.y - target.height / 2, width: target.width, height: target.height };
                    isHit = Collision.checkCircleRect(myCircle, tRect);
                } else if (target.size) {
                    // Circle (Mech)
                    const tCircle = { x: target.x, y: target.y, radius: target.size / 2 };
                    isHit = Collision.checkCircleCircle(myCircle, tCircle);
                }

                if (isHit) {
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

                const otherCircle = { x: other.x, y: other.y, radius: other.size / 2 };

                // Use slightly larger radius for "separation" feeling? 
                // Or just hard collision which causes stacking issues if perfect overlap?
                // Let's use standard collision.
                if (Collision.checkCircleCircle(myCircle, otherCircle)) {
                    // Overlap detected. Who yields?
                    let otherIsAhead = false;

                    if (other.waypointIndex > this.waypointIndex) {
                        otherIsAhead = true;
                    } else if (other.waypointIndex === this.waypointIndex) {
                        const dMe = this.distToWaypoint();
                        const dOther = other.distToWaypoint();
                        if (dOther < dMe) {
                            otherIsAhead = true;
                        } else if (Math.abs(dOther - dMe) < 1) {
                            // Tiebreaker
                            // We don't have stable ID, but we can use X/Y to break tie deterministically
                            if (other.x > this.x || (other.x === this.x && other.y > this.y)) {
                                otherIsAhead = true;
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
