export const TERRAIN = {
    GROUND: 0,
    WALL: 1,
    WATER: 2
};

export class GameMap {
    constructor(width, height, tileSize) {
        this.width = width;
        this.height = height;
        this.tileSize = tileSize;
        this.tiles = [];

        // Initialize with Ground
        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                row.push(TERRAIN.GROUND);
            }
            this.tiles.push(row);
        }

        // Setup Test Level
        this.setupTestLevel();
    }

    setupTestLevel() {
        const cx = Math.floor(this.width / 2);
        const cy = Math.floor(this.height / 2);

        // 1. Clear Center (Safe Zone)
        // (Default is Ground, so we just ensure we don't build here)

        // 2. Build "Arena" Walls (Inner Ring)
        const innerRadius = 8;
        for (let x = cx - innerRadius; x <= cx + innerRadius; x++) {
            this.setTile(x, cy - innerRadius, TERRAIN.WALL);
            this.setTile(x, cy + innerRadius, TERRAIN.WALL);
        }
        for (let y = cy - innerRadius; y <= cy + innerRadius; y++) {
            this.setTile(cx - innerRadius, y, TERRAIN.WALL);
            this.setTile(cx + innerRadius, y, TERRAIN.WALL);
        }

        // 3. Open Gates (Lanes)
        const gateSize = 3;
        // West Gate
        for (let y = cy - 1; y <= cy + 1; y++) this.setTile(cx - innerRadius, y, TERRAIN.GROUND);
        // East Gate
        for (let y = cy - 1; y <= cy + 1; y++) this.setTile(cx + innerRadius, y, TERRAIN.GROUND);
        // North Gate
        for (let x = cx - 1; x <= cx + 1; x++) this.setTile(x, cy - innerRadius, TERRAIN.GROUND);
        // South Gate
        for (let x = cx - 1; x <= cx + 1; x++) this.setTile(x, cy + innerRadius, TERRAIN.GROUND);

        // 4. Outer Hazards (Water/Walls)
        // Add some random water pools outside the arena
        for (let x = cx - 15; x < cx - 10; x++) {
            for (let y = cy - 5; y < cy + 5; y++) {
                this.setTile(x, y, TERRAIN.WATER);
            }
        }
    }

    setTile(x, y, type) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.tiles[y][x] = type;
        }
    }

    getTileAt(worldX, worldY) {
        const x = Math.floor(worldX / this.tileSize);
        const y = Math.floor(worldY / this.tileSize);

        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return TERRAIN.WALL; // Out of bounds is Wall
        }

        return this.tiles[y][x];
    }

    isWalkable(worldX, worldY) {
        const tile = this.getTileAt(worldX, worldY);
        return tile === TERRAIN.GROUND;
    }

    // Checks if the tile blocks projectiles (only Walls)
    isSolid(worldX, worldY) {
        const tile = this.getTileAt(worldX, worldY);
        return tile === TERRAIN.WALL;
    }

    draw(ctx) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tile = this.tiles[y][x];

                if (tile === TERRAIN.GROUND) {
                    ctx.fillStyle = '#222'; // Default background
                    // Optional: Don't draw if it's the same color as clear
                } else if (tile === TERRAIN.WALL) {
                    ctx.fillStyle = '#555';
                    ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                } else if (tile === TERRAIN.WATER) {
                    ctx.fillStyle = '#004488';
                    ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                }
            }
        }

        // Grid lines (optional, kept from main.js or moved here)
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x <= this.width; x++) {
            ctx.moveTo(x * this.tileSize, 0);
            ctx.lineTo(x * this.tileSize, this.height * this.tileSize);
        }
        for (let y = 0; y <= this.height; y++) {
            ctx.moveTo(0, y * this.tileSize);
            ctx.lineTo(this.width * this.tileSize, y * this.tileSize);
        }
        ctx.stroke();
    }
}
