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
        // Create a central "arena" with walls
        for (let x = 5; x < 15; x++) {
            this.setTile(x, 5, TERRAIN.WALL);
            this.setTile(x, 15, TERRAIN.WALL);
        }
        for (let y = 5; y < 15; y++) {
            this.setTile(5, y, TERRAIN.WALL);
            this.setTile(15, y, TERRAIN.WALL);
        }

        // Open some gates
        this.setTile(10, 5, TERRAIN.GROUND); // Top Gate
        this.setTile(10, 15, TERRAIN.GROUND); // Bottom Gate

        // Add a Water pool
        for (let x = 18; x < 22; x++) {
            for (let y = 8; y < 12; y++) {
                this.setTile(x, y, TERRAIN.WATER);
            }
        }

        // Add a random pillar (Wall) inside
        this.setTile(8, 8, TERRAIN.WALL);
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
