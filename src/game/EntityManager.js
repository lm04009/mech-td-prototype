import { CombatSystem } from '../engine/CombatSystem.js';

export class EntityManager {
    constructor() {
        this.enemies = [];
        this.projectiles = [];
        this.towers = [];
    }

    addEnemy(enemy) {
        this.enemies.push(enemy);
    }

    addProjectile(projectile) {
        this.projectiles.push(projectile);
    }

    addTower(tower) {
        this.towers.push(tower);
    }

    getTargets(excludingFaction, game) {
        if (excludingFaction === 'PLAYER') {
            return this.enemies;
        }
        if (excludingFaction === 'ENEMY') {
            return [game.mech, game.terminal];
        }
        return [];
    }

    update(dt, game) {
        const { map, terminal, mech } = game;

        // --- Update Enemies ---
        const enemyTargets = this.getTargets('ENEMY', game);

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            const newProjectile = enemy.update(dt, this.enemies, enemyTargets);

            // Enemy ranged attacks return a projectile
            if (newProjectile) {
                this.projectiles.push(newProjectile);
            }

            if (enemy.markedForDeletion) {
                this.enemies.splice(i, 1);
            }
        }

        // --- Update Projectiles & Resolve Hits via CombatSystem ---
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.update(dt, map);

            if (!p.markedForDeletion) {
                const targets = this.getTargets(p.faction, game);

                for (const target of targets) {
                    const isTargetDead = target.parts ? (target.parts.body.hp <= 0) : (target.hp <= 0);
                    if (isTargetDead) continue;

                    const dx = p.x - target.x;
                    const dy = p.y - target.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const targetRadius = target.size ? target.size / 2 : (target.width ? target.width / 2 : 15);

                    if (dist < (p.size + targetRadius)) {
                        // --- Unified hit resolution ---
                        const result = CombatSystem.resolveHit(p.accuracyRatio, p.attackStat, target);

                        if (result.hit) {
                            if (target.parts) {
                                // Structured target (Mech) — apply to specific part
                                target.applyPartDamage(result.partKey, result.damage);
                            } else if (target.takeDamage) {
                                // Terminal or other entity with takeDamage — fires eventBus
                                target.takeDamage(result.damage);
                            } else {
                                // Fallback: direct HP reduction
                                target.hp = Math.max(0, target.hp - result.damage);
                                if (target.hp <= 0 && target.markedForDeletion !== undefined) {
                                    target.markedForDeletion = true;
                                }
                            }

                            const isDeadAfter = target.parts ? (target.parts.body.hp <= 0) : (target.hp <= 0);
                            if (isDeadAfter && target.bounty) {
                                game.addCredits(target.bounty);
                            }
                        }
                        // Projectile is consumed whether it hit or missed
                        p.markedForDeletion = true;
                        break;
                    }
                }
            }

            if (p.markedForDeletion) {
                this.projectiles.splice(i, 1);
            }
        }

        // --- Update Towers ---
        for (const tower of this.towers) {
            const projectile = tower.update(dt, this.enemies, map);
            if (projectile) {
                this.projectiles.push(projectile);
            }
        }
    }

    draw(ctx) {
        this.enemies.forEach(e => e.draw(ctx));
        this.projectiles.forEach(p => p.draw(ctx));
        this.towers.forEach(t => t.draw(ctx));
    }
}
