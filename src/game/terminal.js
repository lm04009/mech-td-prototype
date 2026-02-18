import { CONFIG } from './Config.js';

export class Terminal {
    constructor(x, y, eventBus) {
        this.x = x;
        this.y = y;
        this.eventBus = eventBus;
        this.width = 60;
        this.height = 60;
        this.faction = CONFIG.FACTION.PLAYER;
        this.maxHp = 1000;
        this.hp = this.maxHp;
        this.color = '#00ffff'; // Cyan
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp < 0) this.hp = 0;

        if (this.eventBus) {
            this.eventBus.emit('terminal:damage', { hp: this.hp, maxHp: this.maxHp });
        }

        return this.hp <= 0;
    }

    draw(ctx) {
        // Draw Main Body
        ctx.fillStyle = this.color;
        // Draw centered
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);

        // Inner detail (Core)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x - 10, this.y - 10, 20, 20);

        // Draw Health Bar
        const barWidth = 80;
        const barHeight = 10;
        const hpPct = this.hp / this.maxHp;

        // Background
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x - barWidth / 2, this.y - this.height / 2 - 20, barWidth, barHeight);

        // Health
        if (hpPct > 0.5) {
            ctx.fillStyle = '#0f0';
        } else if (hpPct > 0.2) {
            ctx.fillStyle = '#ff0';
        } else {
            ctx.fillStyle = '#f00';
        }

        ctx.fillRect(this.x - barWidth / 2, this.y - this.height / 2 - 20, barWidth * hpPct, barHeight);
    }
}
