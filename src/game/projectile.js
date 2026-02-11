export class Projectile {
    constructor(x, y, angle, speed, range) {
        this.x = x;
        this.y = y;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;

        this.spawnX = x;
        this.spawnY = y;
        this.range = range;
        this.markedForDeletion = false;
        this.distanceTraveled = 0;

        this.size = 4;
        this.color = '#ffff00';
    }

    update(dt) {
        // Move
        const dx = this.vx * dt;
        const dy = this.vy * dt;

        this.x += dx;
        this.y += dy;

        // Track distance
        this.distanceTraveled += Math.sqrt(dx * dx + dy * dy);

        // Check range expiration
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
