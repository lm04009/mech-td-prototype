export class Mech {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speed = 200; // pixels per second
        this.size = 40;
        this.color = '#00ff00'; // Green for friendlies
    }

    update(dt, inputVector) {
        if (inputVector.x !== 0 || inputVector.y !== 0) {
            this.x += inputVector.x * this.speed * dt;
            this.y += inputVector.y * this.speed * dt;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Draw Legs (Darker base)
        ctx.fillStyle = '#004400';
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);

        // Draw Torso (Core)
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size / 3, -this.size / 3, this.size / 1.5, this.size / 1.5);

        // Draw Arms (Simple weapon mounts)
        ctx.fillStyle = '#00aa00';
        // Left Arm
        ctx.fillRect(-this.size / 2 - 5, -5, 10, 10);
        // Right Arm
        ctx.fillRect(this.size / 2 - 5, -5, 10, 10);

        // Direction Indicator (Yellow notch)
        // For now, fixed facing up since we don't have mouse rotation yet
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(-2, -this.size / 2, 4, 8);

        ctx.restore();
    }
}
