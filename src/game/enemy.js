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

        this.markedForDeletion = false;
        this.reachedEnd = false;
    }

    update(dt) {
        if (this.markedForDeletion) return;

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
