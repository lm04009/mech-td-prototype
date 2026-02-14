import { TERRAIN } from '../Terrain.js';

export class LaneGenerator {
    constructor(map) {
        this.map = map;
        this.width = map.width;
        this.height = map.height;

        // Configuration
        this.MIN_SOCKETS = 2;
        this.MAX_SOCKETS = 10;
        this.SHORT_PATH_LEN = 20;
        this.LONG_PATH_LEN = 100;
        this.MAX_SEARCH_RADIUS = 5;
    }

    generateLane(id, start, end) {
        console.log(`LaneGenerator: Generating ${id}...`);

        // 1. Pathfinding (A*)
        const path = this.findPath(start, end);
        if (!path || path.length === 0) {
            console.error(`LaneGenerator: Failed to find path for ${id}`);
            return null;
        }
        console.log(`LaneGenerator: Path Length = ${path.length} tiles`);

        // 2. Socket Count Calculation
        const t = this.clamp((path.length - this.SHORT_PATH_LEN) / (this.LONG_PATH_LEN - this.SHORT_PATH_LEN), 0, 1);
        const targetSocketCount = Math.round(this.lerp(this.MIN_SOCKETS, this.MAX_SOCKETS, t));
        console.log(`LaneGenerator: Target Sockets = ${targetSocketCount}`);

        // 3. Socket Placement
        const sockets = this.placeSockets(path, targetSocketCount);
        console.log(`LaneGenerator: Placed Sockets = ${sockets.length}`);

        if (sockets.length < targetSocketCount) {
            console.warn(`LaneGenerator: Wanted ${targetSocketCount} sockets, could only place ${sockets.length}.`);
        }

        return {
            id: id,
            path: path,
            sockets: sockets
        };
    }

    findPath(start, end) {
        // A* Implementation
        const openSet = [start];
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();

        const key = (pt) => `${pt.x},${pt.y}`;

        gScore.set(key(start), 0);
        fScore.set(key(start), this.heuristic(start, end));

        while (openSet.length > 0) {
            // Get node with lowest fScore
            let current = openSet.reduce((a, b) =>
                (fScore.get(key(a)) ?? Infinity) < (fScore.get(key(b)) ?? Infinity) ? a : b
            );

            if (current.x === end.x && current.y === end.y) {
                return this.reconstructPath(cameFrom, current);
            }

            openSet.splice(openSet.indexOf(current), 1);

            for (const neighbor of this.getNeighbors(current)) {
                // Cost: Ground=1, Impassable=Infinity
                // Note: We avoid Sockets (treated as constraints)
                if (!this.isWalkable(neighbor.x, neighbor.y)) continue;

                const tentativeG = (gScore.get(key(current)) ?? Infinity) + 1;

                if (tentativeG < (gScore.get(key(neighbor)) ?? Infinity)) {
                    cameFrom.set(key(neighbor), current);
                    gScore.set(key(neighbor), tentativeG);
                    fScore.set(key(neighbor), tentativeG + this.heuristic(neighbor, end));

                    if (!openSet.some(n => n.x === neighbor.x && n.y === neighbor.y)) {
                        openSet.push(neighbor);
                    }
                }
            }
        }

        return null; // No path
    }

    placeSockets(path, count) {
        const sockets = [];
        if (count <= 0) return sockets;

        const interval = path.length / count;

        for (let i = 0; i < count; i++) {
            const idealIndex = Math.floor(i * interval + interval / 2);
            if (idealIndex >= path.length) continue;

            const idealPos = path[idealIndex];
            const spot = this.findValidSocketSpot(idealPos, path, sockets);

            if (spot) {
                sockets.push(spot);
                // Mark strictly in generator map (if we were modifying it) so next checks see it
                // For now, checks are done against 'sockets' array
            }
        }
        return sockets;
    }

    findValidSocketSpot(center, path, existingSockets) {
        // Spiral Search
        for (let r = 1; r <= this.MAX_SEARCH_RADIUS; r++) {
            const candidates = this.getRing(center, r);

            // OPTIONAL: Sort candidates by some heuristic? (e.g. Euclidean dist to path?)
            // For now, just take first valid.

            for (const tile of candidates) {
                if (this.isValidSocketLocation(tile, path, existingSockets)) {
                    return tile;
                }
            }
        }
        return null;
    }

    isValidSocketLocation(tile, path, existingSockets) {
        // 1. Bounds & Terrain
        if (tile.x < 0 || tile.x >= this.width || tile.y < 0 || tile.y >= this.height) return false;

        const type = this.map.getTileAt(tile.x * this.map.tileSize, tile.y * this.map.tileSize); // map.getTileAt takes WORLD coords
        // Actually map.js internal storage is grid based. Let's use direct access if possible or convert.
        // Looking at map.js: tiles[y][x].

        if (this.map.tiles[tile.y][tile.x] !== TERRAIN.GROUND) return false;

        // 2. Avoid Path (Impassable constraint means Lane shouldn't be blocked by it, 
        // AND Socket shouldn't be ON the path)
        if (path.some(p => p.x === tile.x && p.y === tile.y)) return false;

        // 3. Avoid Existing Sockets (Don't stack)
        if (existingSockets.some(s => s.x === tile.x && s.y === tile.y)) return false;

        // 4. Avoid Pre-existing Sockets on Map? (If any)
        if (this.map.tiles[tile.y][tile.x] === TERRAIN.SOCKET) return false;

        return true;
    }

    // --- Helpers ---

    getNeighbors(node) {
        const result = [];
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]]; // Cardinals only for movement?
        // Let's assume Cardinals for now.
        for (const [dx, dy] of dirs) {
            result.push({ x: node.x + dx, y: node.y + dy });
        }
        return result;
    }

    getRing(center, radius) {
        // Returns tiles at manhattan distance 'radius' (or square ring)
        const results = [];
        for (let x = -radius; x <= radius; x++) {
            for (let y = -radius; y <= radius; y++) {
                if (Math.abs(x) === radius || Math.abs(y) === radius) {
                    results.push({ x: center.x + x, y: center.y + y });
                }
            }
        }
        return results;
    }

    heuristic(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); // Manhattan
    }

    reconstructPath(cameFrom, current) {
        const totalPath = [current];
        const key = (pt) => `${pt.x},${pt.y}`;
        while (cameFrom.has(key(current))) {
            current = cameFrom.get(key(current));
            totalPath.unshift(current);
        }
        return totalPath;
    }

    isWalkable(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
        const tile = this.map.tiles[y][x];
        // Sockets are IMPASSABLE for lane generation
        return tile === TERRAIN.GROUND;
    }

    lerp(a, b, t) {
        return a + (b - a) * t;
    }

    clamp(val, min, max) {
        return Math.min(Math.max(val, min), max);
    }
}
