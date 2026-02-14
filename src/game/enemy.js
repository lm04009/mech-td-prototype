export class Enemy {
    constructor(path) {
        this.path = path;
        this.waypointIndex = 0;
        this.x = path[0].x;
        this.y = path[0].y;

        this.speed = 50; // pixels per second
        this.size = 30;
        this.hp = 20;
        this.damage = 100; // Damage to terminal
        this.color = '#ff0000'; // Red
        this.bounty = 25; // Credits reward

        this.markedForDeletion = false;
        this.reachedEnd = false;
    }

    update(dt, allEnemies) {
        if (this.markedForDeletion) return;

        // 1. Separation (Avoid Crowding)
        if (allEnemies) {
            let separationX = 0;
            let separationY = 0;
            let count = 0;

            for (const other of allEnemies) {
                if (other === this) continue;

                const dx = this.x - other.x;
                const dy = this.y - other.y;
                const distSq = dx * dx + dy * dy;

                // Separation Radius
                const minDist = this.size * 1.1;

                if (distSq < minDist * minDist && distSq > 0.001) {
                    const dist = Math.sqrt(distSq);
                    const force = (minDist - dist) / minDist;

                    // Push away
                    separationX += (dx / dist) * force;
                    separationY += (dy / dist) * force;
                    count++;
                }
            }

            if (count > 0) {
                // Apply separation force
                const strength = 80 * dt;
                this.x += (separationX / count) * strength;
                this.y += (separationY / count) * strength;

                // Braking: If crowded, slow down 
                // (Reduces jitter when stacking)
                if (count > 2) {
                    this.speed = 30; // Crowded speed
                } else {
                    this.speed = 50; // Normal speed
                }
            } else {
                this.speed = 50;
            }
        }

        // Target current waypoint
        const target = this.path[this.waypointIndex];
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Move towards target
        if (dist > 5) {
            const moveDist = this.speed * dt;
            this.x += (dx / dist) * moveDist;
            this.y += (dy / dist) * moveDist;
        } else {
            // Reached waypoint
            this.waypointIndex++;
            if (this.waypointIndex >= this.path.length) {
                this.reachedEnd = true;
                this.markedForDeletion = true;
            }
        }
    }

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
        const hpPct = this.hp / 20;
        ctx.fillStyle = '#0f0';
        ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2 - 5, this.size * hpPct, 3);
    }
}
