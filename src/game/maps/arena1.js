import { TERRAIN } from '../Terrain.js';

function buildArena1() {
    const width = 50;
    const height = 50;
    const tileSize = 40;
    const cx = Math.floor(width / 2);
    const cy = Math.floor(height / 2);

    const tiles = [];

    // Inner ring walls
    const innerRadius = 8;
    for (let x = cx - innerRadius; x <= cx + innerRadius; x++) {
        tiles.push({ x, y: cy - innerRadius, type: TERRAIN.WALL });
        tiles.push({ x, y: cy + innerRadius, type: TERRAIN.WALL });
    }
    for (let y = cy - innerRadius; y <= cy + innerRadius; y++) {
        tiles.push({ x: cx - innerRadius, y, type: TERRAIN.WALL });
        tiles.push({ x: cx + innerRadius, y, type: TERRAIN.WALL });
    }

    // Gates — 3-wide gaps in the ring walls (N, S, E, W)
    const gates = [
        { x: cx, y: cy - innerRadius }, // N
        { x: cx, y: cy + innerRadius }, // S
        { x: cx + innerRadius, y: cy }, // E
        { x: cx - innerRadius, y: cy }, // W
    ];
    for (const g of gates) {
        for (let i = -1; i <= 1; i++) {
            if (g.x === cx) {
                tiles.push({ x: g.x + i, y: g.y, type: TERRAIN.GROUND });
            } else {
                tiles.push({ x: g.x, y: g.y + i, type: TERRAIN.GROUND });
            }
        }
    }

    // Water hazard
    for (let x = cx - 15; x < cx - 10; x++) {
        for (let y = cy - 5; y < cy + 5; y++) {
            tiles.push({ x, y, type: TERRAIN.WATER });
        }
    }

    return {
        id: 'arena_1',
        width,
        height,
        tileSize,
        tiles,
        spawners: [
            { id: 'NORTH',  x: cx,          y: 2              },
            { id: 'SOUTH',  x: cx,          y: height - 3     },
            { id: 'EAST',   x: width - 3,   y: cy             },
            { id: 'WEST',   x: 2,           y: cy             },
            { id: 'CUSTOM', x: 35,          y: 35             },
        ],
        terminalPos: { x: cx, y: cy },
    };
}

export const ARENA_1 = buildArena1();
