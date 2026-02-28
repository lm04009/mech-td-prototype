import { LaneGenerator } from './map/LaneGenerator.js';
import { TERRAIN } from './Terrain.js';

export { TERRAIN }; // Re-export for compatibility if needed, or just remove export if unused externally (Game.js uses it?) 
// Game.js generally imports GameMap. But maybe imports TERRAIN from map.js?
// Inspecting Game.js imports... it didn't import TERRAIN explicitly in my view earlier.
// Wait, isBuildable used TERRAIN.SOCKET.
// LaneGenerator imports TERRAIN.
// check imports in other files?
// Let's re-export it to be safe.


export class GameMap {
    constructor(width, height, tileSize) {
        this.width = width;
        this.height = height;
        this.tileSize = tileSize;
        this.tiles = [];
        this.towers = []; // Track occupied towers [y][x]
        this.lanes = {};

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

        // Setup Test Level
        this.setupTestLevel();

        // Pending Sockets Queue (for deferred spawning)
        this.pendingSockets = [];
    }

    update(dt, player) {
        // Process Pending Sockets
        // If player has moved away, spawn them
        for (let i = this.pendingSockets.length - 1; i >= 0; i--) {
            const socket = this.pendingSockets[i];

            // Define Socket Rect
            const socketRect = {
                x: socket.x * this.tileSize,
                y: socket.y * this.tileSize,
                width: this.tileSize,
                height: this.tileSize
            };

            // Player Circle
            const playerCircle = {
                x: player.x,
                y: player.y,
                radius: player.size / 2
            };

            // Check Collision (Simple Center distance or AABB is enough here)
            // Using Collision helper logic inline for speed or logic simplicity
            // Center-to-Center check with generous margin
            const sx = socketRect.x + this.tileSize / 2;
            const sy = socketRect.y + this.tileSize / 2;
            const dx = Math.abs(player.x - sx);
            const dy = Math.abs(player.y - sy);

            // Combined Radius approx (Player 20 + Socket 20)
            // If dist < 40, we are touching/overlapping. 
            // Wait until player is CLEAR (dist > 50 safe margin)
            if (dx > 40 || dy > 40) {
                // Clear! Spawn it.
                this.setTile(socket.x, socket.y, TERRAIN.SOCKET);
                this.pendingSockets.splice(i, 1);
                console.log(`Map: Pending socket at ${socket.x},${socket.y} spawned.`);
            }
        }
    }

    setupTestLevel() {
        const cx = Math.floor(this.width / 2);
        const cy = Math.floor(this.height / 2);

        // 1. Clear Center (Safe Zone)
        // (Default is Ground)

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

        // 3. Open Gates (Gap in Walls)
        const GATES = [
            { x: cx, y: cy - innerRadius }, // N
            { x: cx, y: cy + innerRadius }, // S
            { x: cx + innerRadius, y: cy }, // E
            { x: cx - innerRadius, y: cy }, // W
        ];
        // Clear 3-wide gaps
        for (let g of GATES) {
            for (let i = -1; i <= 1; i++) {
                if (g.x === cx) this.setTile(g.x + i, g.y, TERRAIN.GROUND);
                else this.setTile(g.x, g.y + i, TERRAIN.GROUND);
            }
        }

        // 4. Outer Hazards (Water/Walls)
        // Add some random water pools to test pathfinding
        for (let x = cx - 15; x < cx - 10; x++) {
            for (let y = cy - 5; y < cy + 5; y++) {
                this.setTile(x, y, TERRAIN.WATER);
            }
        }

        // 5. Generate Lanes (Dynamic)
        this.generateLanes(cx, cy);
    }

    generateLanes(cx, cy) {
        // center is target
        const center = { x: cx, y: cy };
        const TS = this.tileSize;

        // Define Spawners
        const SPAWNERS = [
            { id: 'NORTH', x: cx, y: 2 },
            { id: 'SOUTH', x: cx, y: this.height - 3 },
            { id: 'EAST', x: this.width - 3, y: cy },
            { id: 'WEST', x: 2, y: cy }, // Far West
            { id: 'CUSTOM', x: 35, y: 35 } // User Request (SE)
        ];

        this.lanes = {};

        const generator = new LaneGenerator(this);

        for (const spawner of SPAWNERS) {
            const laneObj = generator.generateLane(spawner.id, spawner, center);
            if (laneObj) {
                // Convert Path to World
                const worldPath = laneObj.path.map(p => ({
                    x: p.x * TS + TS / 2,
                    y: p.y * TS + TS / 2
                }));

                this.lanes[spawner.id] = {
                    id: spawner.id,
                    path: worldPath,
                    sockets: laneObj.sockets // Grid Coords
                };

                // Mark Sockets on Map as HIDDEN initially
                for (const s of laneObj.sockets) {
                    this.setTile(s.x, s.y, TERRAIN.HIDDEN_SOCKET);
                }
            }
        }
    }

    unlockLaneSockets(laneId) {
        const lane = this.lanes[laneId];
        if (!lane || !lane.sockets) {
            console.warn(`Map: Cannot unlock sockets for unknown lane ${laneId}`);
            return;
        }

        console.log(`Map: Unlocking ${lane.sockets.length} sockets for ${laneId}`);
        for (const s of lane.sockets) {
            // Only unlock if it's currently hidden
            if (this.tiles[s.y][s.x] === TERRAIN.HIDDEN_SOCKET) {
                // Defer spawning if blocked
                this.pendingSockets.push({ x: s.x, y: s.y });
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
        const x = Math.floor(worldX / this.tileSize);
        const y = Math.floor(worldY / this.tileSize);

        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;

        const tile = this.tiles[y][x];
        const tower = this.towers[y][x];

        // 1. Check Terrain
        // Socket = Impassable (Visible)
        // Hidden Socket = Passable
        // Ground = Passable
        if (tile === TERRAIN.SOCKET || tile === TERRAIN.WALL || tile === TERRAIN.WATER) return false;

        // 2. Check Static Objects (Towers)
        if (tower) return false;

        return true;
    }

    /**
     * Mech-state-aware walkability check for pathfinding (grid coordinates).
     * Unlike isWalkable() (world coords, collision system), this uses grid coords
     * and respects legs capabilities (e.g. hover legs crossing water in future).
     *
     * @param {number} gx - Grid X
     * @param {number} gy - Grid Y
     * @param {object} legsData - Mech legs part data. Supports: { canCrossWater: bool }
     * @returns {boolean}
     */
    isWalkableFor(gx, gy, legsData) {
        if (gx < 0 || gx >= this.width || gy < 0 || gy >= this.height) return false;

        const tile = this.tiles[gy][gx];
        const tower = this.towers[gy][gx];

        if (tile === TERRAIN.WALL) return false;
        if (tile === TERRAIN.WATER) return legsData?.canCrossWater === true;
        if (tile === TERRAIN.SOCKET && tower) return false; // Socket with a built tower is blocked

        // GROUND, HIDDEN_SOCKET, empty SOCKET → passable
        return true;
    }

    // Helper to get all obstacles near a rectangle
    getObstacles(rect) {
        const obstacles = [];

        // Convert rect to grid bounds (expanded)
        const startX = Math.floor(rect.x / this.tileSize);
        const endX = Math.floor((rect.x + rect.width) / this.tileSize);
        const startY = Math.floor(rect.y / this.tileSize);
        const endY = Math.floor((rect.y + rect.height) / this.tileSize);

        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
                    // Out of bounds is solid
                    obstacles.push({
                        type: 'WALL',
                        x: x * this.tileSize,
                        y: y * this.tileSize,
                        width: this.tileSize,
                        height: this.tileSize
                    });
                    continue;
                }

                const tile = this.tiles[y][x];
                const tower = this.towers[y][x];

                let isSolid = false;
                let type = 'WALL';

                if (tile === TERRAIN.WALL) isSolid = true;
                if (tile === TERRAIN.WATER) { isSolid = true; type = 'WATER'; }
                if (tile === TERRAIN.SOCKET) { isSolid = true; type = 'SOCKET'; } // Visible Sockets are Solid

                if (tower) { isSolid = true; type = 'TOWER'; }

                if (isSolid) {
                    obstacles.push({
                        type: type,
                        x: x * this.tileSize,
                        y: y * this.tileSize,
                        width: this.tileSize,
                        height: this.tileSize
                    });
                }
            }
        }
        return obstacles;
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

                if (tile === TERRAIN.GROUND || tile === TERRAIN.HIDDEN_SOCKET) {
                    ctx.fillStyle = '#222'; // Hidden socket looks like ground
                    // Maybe debug draw hidden sockets slightly differently?
                    // ctx.fillStyle = '#252525'; 
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

        // Grid lines
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

    // Helpers
    // ...
    getLanePath(laneId) {
        return this.lanes[laneId] ? this.lanes[laneId].path : [];
    }

    getAllLanes() {
        return this.lanes;
    }
}
