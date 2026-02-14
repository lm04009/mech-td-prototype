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

    update(dt, game) {
        const { map, terminal } = game;

        // Update Enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(dt, this.enemies);

            if (enemy.reachedEnd) {
                terminal.takeDamage(enemy.damage);
                // game.eventBus.emit('TERMINAL_DAMAGED', enemy.damage); // Future
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
                // Collision with enemies
                for (const enemy of this.enemies) {
                    const dx = p.x - enemy.x;
                    const dy = p.y - enemy.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    // Simple circle collision
                    if (dist < (p.size + enemy.size / 2)) {
                        enemy.takeDamage(10); // TODO: Use weapon damage
                        p.markedForDeletion = true;

                        if (enemy.hp <= 0) {
                            game.addCredits(enemy.bounty);
                            // game.eventBus.emit('ENEMY_KILLED', enemy.bounty);
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
