import { Weapon } from './weapon.js';

export class Mech {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speed = 200; // pixels per second
        this.size = 40;
        this.color = '#00ff00'; // Green for friendlies

        // Weapons
        this.weaponLeft = new Weapon(300, 400, '#ffff00'); // Medium Range
        // this.weaponRight = ...

        this.angle = 0; // Facing angle
    }

    update(dt, inputVector, mousePos, inputState, map) {
        // Movement
        if (inputVector.x !== 0 || inputVector.y !== 0) {
            const nextX = this.x + inputVector.x * this.speed * dt;
            const nextY = this.y + inputVector.y * this.speed * dt;

            // Basic Collision Check (Center Point) for v0
            // Ideally should check corners, but point check is enough to prove concept
            if (map.isWalkable(nextX, this.y)) {
                this.x = nextX;
            }
            if (map.isWalkable(this.x, nextY)) {
                this.y = nextY;
            }
        }

        // Face Mouse
        if (mousePos) {
            this.angle = Math.atan2(mousePos.y - this.y, mousePos.x - this.x);
        }

        // Update Weapons
        this.weaponLeft.update(dt);

        // Fire Input
        if (inputState && inputState.isDown) {
            // Try to fire left weapon
            // Weapon mount position is slightly offset, but using center for v0 simplicity
            return this.weaponLeft.fire(this.x, this.y, mousePos.x, mousePos.y);
        }

        return null;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + Math.PI / 2); // Adjust so "up" is 0 degrees visual, but atan2 assumes 0 is right.

        // Draw Range Indicator (Faint)
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.2)';
        ctx.beginPath();
        ctx.arc(0, 0, this.weaponLeft.range, 0, Math.PI * 2);
        ctx.stroke();

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
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(-2, -this.size / 2, 4, 8);

        ctx.restore();
    }
}
