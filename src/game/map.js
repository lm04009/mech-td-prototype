export const TERRAIN = {
    GROUND: 0,
    WALL: 1,
    WATER: 2,
    SOCKET: 3
};

export class GameMap {
    constructor(width, height, tileSize) {
        this.width = width;
        this.height = height;
        this.tileSize = tileSize;
        this.tiles = [];
        this.towers = []; // Track occupied towers [y][x]

        // Initialize with Ground
        for (let y = 0; y < height; y++) {
            const row = [];
            const towerRow = [];
            for (let x = 0; x < width; x++) {
                row.push(TERRAIN.GROUND);
                towerRow.push(null);
            }
            this.tiles.push(row);
            this.towers.push(towerRow);
        }

        // Precompute Lanes
        this.lanes = this.defineLanes();

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

        // 5. Strategic Sockets
        // Gate Defenders
        this.setTile(cx - innerRadius - 1, cy - 3, TERRAIN.SOCKET);
        this.setTile(cx - innerRadius - 1, cy + 3, TERRAIN.SOCKET);
        this.setTile(cx + innerRadius + 1, cy - 3, TERRAIN.SOCKET);
        this.setTile(cx + innerRadius + 1, cy + 3, TERRAIN.SOCKET);

        // Inner Defense Ring
        this.setTile(cx - 3, cy - 3, TERRAIN.SOCKET);
        this.setTile(cx + 3, cy - 3, TERRAIN.SOCKET);
        this.setTile(cx - 3, cy + 3, TERRAIN.SOCKET);
        this.setTile(cx + 3, cy + 3, TERRAIN.SOCKET);
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

    // Check if a TOWER can be built here (Grid Coordinates)
    isBuildable(col, row) {
        if (col < 0 || col >= this.width || row < 0 || row >= this.height) return false;

        // Rule 1: Must be a SOCKET
        if (this.tiles[row][col] !== TERRAIN.SOCKET) return false;

        // Rule 2: Must be Empty
        if (this.towers[row][col] !== null) return false;

        return true;
    }

    addTower(tower) {
        const col = Math.floor(tower.x / this.tileSize);
        const row = Math.floor(tower.y / this.tileSize);
        if (this.isBuildable(col, row)) {
            this.towers[row][col] = tower;
            return true;
        }
        return false;
    }

    isWalkable(worldX, worldY) {
        const tile = this.getTileAt(worldX, worldY);
        // Sockets are also walkable by default (unless they have a tower?)
        // For now, let's say Sockets IS walkable.
        return tile === TERRAIN.GROUND || tile === TERRAIN.SOCKET;
    }

    // Checks if the tile blocks projectiles (only Walls)
    isSolid(worldX, worldY) {
        const tile = this.getTileAt(worldX, worldY);
        return tile === TERRAIN.WALL;
    }

    // Simple Raycast for Line of Sight
    hasLineOfSight(x0, y0, x1, y1) {
        const dx = x1 - x0;
        const dy = y1 - y0;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.ceil(dist / (this.tileSize / 2)); // Check every half-tile

        for (let i = 1; i < steps; i++) {
            const t = i / steps;
            const x = x0 + dx * t;
            const y = y0 + dy * t;

            if (this.isSolid(x, y)) {
                return false;
            }
        }
        return true;
    }

    draw(ctx) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tile = this.tiles[y][x];

                if (tile === TERRAIN.GROUND) {
                    ctx.fillStyle = '#222';
                } else if (tile === TERRAIN.WALL) {
                    ctx.fillStyle = '#555';
                    ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                } else if (tile === TERRAIN.WATER) {
                    ctx.fillStyle = '#004488';
                    ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                } else if (tile === TERRAIN.SOCKET) {
                    // Draw Socket Base
                    ctx.fillStyle = '#333';
                    ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);

                    // Draw Socket Ring
                    ctx.strokeStyle = '#666';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x * this.tileSize + 5, y * this.tileSize + 5, this.tileSize - 10, this.tileSize - 10);
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

    defineLanes() {
        const cx = Math.floor(this.width * this.tileSize / 2);
        const cy = Math.floor(this.height * this.tileSize / 2);
        const TS = this.tileSize;

        // Helper to center on tile
        const t = (c, r) => ({ x: c * TS + TS / 2, y: r * TS + TS / 2 });

        // Center Tile (Goal)
        const center = t(Math.floor(this.width / 2), Math.floor(this.height / 2));

        return {
            NORTH: [
                t(Math.floor(this.width / 2), 2), // Start slightly inset
                center
            ],
            SOUTH: [
                t(Math.floor(this.width / 2), this.height - 3),
                center
            ],
            EAST: [
                t(this.width - 3, Math.floor(this.height / 2)),
                center
            ],
            WEST: [
                // Complex Path avoiding Water (x:10-15, meaning 10..14)
                // Center is ~25, 25. Gate is at x=17, y=25.
                // Socket is at x=16, y=22 and y=28.
                // Water is at x=10..14, y=20..29.
                // x=15 is safe GROUND (between Water at x=14 and Socket/Gate at x=16/17).

                // 1. Start Left Edge(x=1, y=25)
                t(1, 25),

                // 2. Go straight EAST to x=8 (Before Water at x=10)
                t(8, 25),

                // 3. Divert UP around water (to y=18, above y=20)
                t(8, 18),

                // 4. Go EAST across top of water (to x=15, safe from Water and Sockets along x=16)
                t(15, 18),

                // 5. Go DOWN to align with Gate (y=25)
                // This vertical line x=15, y=18->25 stays right of Water (x=14) and left of Sockets (x=16)
                t(15, 25),

                // 6. Go EAST through Gate (x=17+) to Center (25, 25)
                // Passes (16, 25) which is safe ground between Sockets (16,22) and (16,28).
                center
            ]
        };
    }

    getLanePath(laneId) {
        return this.lanes[laneId] || [];
    }

    getAllLanes() {
        return this.lanes;
    }
}
