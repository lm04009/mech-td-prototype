import { Enemy } from './enemy.js';

export class EncounterManager {
    constructor(game) {
        this.game = game;
        this.spawnTimer = 0;
        this.spawnInterval = 2; // Initial simple interval
        this.active = true;

        // Hardcoded path for v0 (Same as main.js)
        // This will eventually move to Map or Level Data
        const cx = (game.map.width * 40) / 2; // TILE_SIZE = 40
        const cy = (game.map.height * 40) / 2;

        this.defaultPath = [
            { x: 0, y: cy - (7 * 40) }, // Start Top-Left
            { x: cx - (8 * 40), y: cy - (7 * 40) }, // Go past water
            { x: cx - (8 * 40), y: cy }, // Go Down
            { x: cx, y: cy } // Terminal
        ];
    }

    update(dt) {
        if (!this.active) return;

        this.spawnTimer += dt;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnEnemy();
        }
    }

    spawnEnemy() {
        const enemy = new Enemy(this.defaultPath);
        this.game.entities.addEnemy(enemy);
    }
}
