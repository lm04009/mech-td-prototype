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

        // Update Enemies
        const enemyTargets = this.getTargets('ENEMY', game);

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(dt, this.enemies, enemyTargets);

            if (enemy.reachedEnd) {
                // Legacy check, now handled by combat loop?
                // The new Enemy.update will attack terminal if close.
                // But for v0 speed, maybe keep the "reachedEnd" flag for despawning?
                // If enemy reaches end of path, it should STOP and attack terminal.
                // It shouldn't just "reach end and disappear" unless it deals damage once.
                // The new logic says: stop and attack.
                // So "reachedEnd" might need to be removed or repurposed.
                // Let's rely on Valid Targets for now.
            }

            if (enemy.markedForDeletion) {
                this.enemies.splice(i, 1);
            }
        }

        // Update Projectiles & Collision
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.update(dt, map);

            if (!p.markedForDeletion) {
                // Unified Target Retrieval
                const targets = this.getTargets(p.faction, game);

                for (const target of targets) {
                    if (target.hp <= 0) continue; // Skip dead

                    const dx = p.x - target.x;
                    const dy = p.y - target.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    // Simple circle collision
                    const targetSize = target.size || (target.width ? target.width / 2 : 15); // Fallback or box approx

                    if (dist < (p.size + targetSize / 2)) {
                        target.takeDamage(p.damage);
                        p.markedForDeletion = true;

                        if (target.hp <= 0) {
                            if (target.bounty) game.addCredits(target.bounty);
                        }
                        break;
                    }
                }
            }

            if (p.markedForDeletion) {
                this.projectiles.splice(i, 1);
            }
        }

        // Update Towers
        for (const tower of this.towers) {
            // Towers need enemies to aim/fire
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
