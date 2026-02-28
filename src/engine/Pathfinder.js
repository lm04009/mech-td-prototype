/**
 * Pathfinder — standalone A* + BFS-snap utility for grid-based pathfinding.
 *
 * Design decisions:
 *  - 8-directional movement (cardinal cost 1.0, diagonal cost √2).
 *  - Walkability is a caller-supplied callback: isWalkable(gx, gy) → bool.
 *    This keeps the pathfinder decoupled from terrain types and mech state.
 *  - BFS ring-expansion snap: if the target tile is not walkable, finds the
 *    nearest walkable tile before running A*.
 *  - Returns grid-space {x, y} waypoints. Caller converts to world space.
 *  - Open set uses an unsorted array (O(n²) insert). Acceptable for ≤50×50
 *    grids. Swap to a min-heap if maps grow significantly (>150×150).
 */
export class Pathfinder {
    /**
     * Find a path from startGrid to endGrid on a tile grid.
     *
     * @param {{ x: number, y: number }} startGrid  - Start tile (grid coords)
     * @param {{ x: number, y: number }} endGrid    - Target tile (grid coords)
     * @param {function(number, number): boolean} isWalkable - (gx, gy) → bool
     * @param {number} gridW - Grid width in tiles
     * @param {number} gridH - Grid height in tiles
     * @returns {{ x: number, y: number }[]|null} - Array of grid-space waypoints,
     *   or null if no path exists (after snap, this should be rare).
     */
    static findPath(startGrid, endGrid, isWalkable, gridW, gridH) {
        const key = (x, y) => y * gridW + x;

        const start = { x: Math.round(startGrid.x), y: Math.round(startGrid.y) };
        const end = { x: Math.round(endGrid.x), y: Math.round(endGrid.y) };

        // Trivial case
        if (start.x === end.x && start.y === end.y) return [start];

        // Guard: start must be walkable, else no path possible
        if (!isWalkable(start.x, start.y)) return null;

        const DIRS = [
            { dx: 1, dy: 0, cost: 1.0 }, // E
            { dx: -1, dy: 0, cost: 1.0 }, // W
            { dx: 0, dy: 1, cost: 1.0 }, // S
            { dx: 0, dy: -1, cost: 1.0 }, // N
            { dx: 1, dy: 1, cost: 1.414 }, // SE
            { dx: -1, dy: 1, cost: 1.414 }, // SW
            { dx: 1, dy: -1, cost: 1.414 }, // NE
            { dx: -1, dy: -1, cost: 1.414 }, // NW
        ];

        const gScore = new Map();
        const fScore = new Map();
        const cameFrom = new Map();
        const openSet = [];

        const startKey = key(start.x, start.y);
        gScore.set(startKey, 0);
        fScore.set(startKey, Pathfinder._octile(start, end));
        openSet.push(start);

        while (openSet.length > 0) {
            // Pick node with lowest fScore (linear scan — acceptable for small grids)
            let bestIdx = 0;
            let bestF = fScore.get(key(openSet[0].x, openSet[0].y)) ?? Infinity;
            for (let i = 1; i < openSet.length; i++) {
                const f = fScore.get(key(openSet[i].x, openSet[i].y)) ?? Infinity;
                if (f < bestF) { bestF = f; bestIdx = i; }
            }
            const current = openSet[bestIdx];
            openSet.splice(bestIdx, 1);

            if (current.x === end.x && current.y === end.y) {
                return Pathfinder._reconstruct(cameFrom, current, key);
            }

            const curKey = key(current.x, current.y);
            const curG = gScore.get(curKey) ?? Infinity;

            for (const { dx, dy, cost } of DIRS) {
                const nx = current.x + dx;
                const ny = current.y + dy;

                if (nx < 0 || nx >= gridW || ny < 0 || ny >= gridH) continue;
                if (!isWalkable(nx, ny)) continue;

                // For diagonals: require both cardinal neighbours to be walkable
                // (prevents cutting corners through wall edges)
                if (dx !== 0 && dy !== 0) {
                    if (!isWalkable(current.x + dx, current.y)) continue;
                    if (!isWalkable(current.x, current.y + dy)) continue;
                }

                const nKey = key(nx, ny);
                const tentG = curG + cost;
                const existG = gScore.get(nKey) ?? Infinity;

                if (tentG < existG) {
                    cameFrom.set(nKey, current);
                    gScore.set(nKey, tentG);
                    fScore.set(nKey, tentG + Pathfinder._octile({ x: nx, y: ny }, end));
                    if (!openSet.some(n => n.x === nx && n.y === ny)) {
                        openSet.push({ x: nx, y: ny });
                    }
                }
            }
        }

        return null; // No path found
    }

    /**
     * BFS ring-expansion: find the nearest walkable tile to targetGrid.
     * Used when the player clicks an unwalkable tile (wall, water, tower).
     * Returns the original tile if it is already walkable.
     *
     * @param {{ x: number, y: number }} targetGrid
     * @param {function(number, number): boolean} isWalkable
     * @param {number} gridW
     * @param {number} gridH
     * @returns {{ x: number, y: number }} - Nearest walkable tile (grid coords)
     */
    static snapToNearestWalkable(targetGrid, isWalkable, gridW, gridH) {
        const tx = Math.round(targetGrid.x);
        const ty = Math.round(targetGrid.y);

        if (isWalkable(tx, ty)) return { x: tx, y: ty };

        const visited = new Set();
        const queue = [{ x: tx, y: ty }];
        visited.add(`${tx},${ty}`);

        while (queue.length > 0) {
            const { x, y } = queue.shift();

            // Check all 8 neighbours
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    const nx = x + dx;
                    const ny = y + dy;
                    if (nx < 0 || nx >= gridW || ny < 0 || ny >= gridH) continue;
                    const nk = `${nx},${ny}`;
                    if (visited.has(nk)) continue;
                    visited.add(nk);
                    if (isWalkable(nx, ny)) return { x: nx, y: ny };
                    queue.push({ x: nx, y: ny });
                }
            }
        }

        // Entire grid is unwalkable — return original (edge case)
        return { x: tx, y: ty };
    }

    /** Octile distance heuristic for 8-directional A*. */
    static _octile(a, b) {
        const dx = Math.abs(a.x - b.x);
        const dy = Math.abs(a.y - b.y);
        return (dx + dy) + (1.414 - 2) * Math.min(dx, dy);
    }

    static _reconstruct(cameFrom, current, key) {
        const path = [];
        let node = current;
        while (node) {
            path.unshift({ x: node.x, y: node.y });
            node = cameFrom.get(key(node.x, node.y));
        }
        return path;
    }
}
