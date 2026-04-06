import { TERRAIN } from '../Terrain.js';

function buildHub() {
    const width = 50;
    const height = 50;
    const tileSize = 40;
    const cx = Math.floor(width / 2);
    const cy = Math.floor(height / 2);

    const tiles = [];
    const roomSize = 10;

    // Fill everything outside the room with walls; inside is GROUND (default)
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            if (
                x < cx - roomSize || x > cx + roomSize ||
                y < cy - roomSize || y > cy + roomSize ||
                x === cx - roomSize || x === cx + roomSize ||
                y === cy - roomSize || y === cy + roomSize
            ) {
                tiles.push({ x, y, type: TERRAIN.WALL });
            }
        }
    }

    return {
        id: 'hub',
        width,
        height,
        tileSize,
        tiles,
        interactables: [
            {
                id: 'hangar',
                name: 'Hangar Console',
                gridX: cx - 3,
                gridY: cy - 3,
                radius: 80,
            },
            {
                id: 'map_device',
                name: 'Map Device',
                gridX: cx + 3,
                gridY: cy - 3,
                radius: 80,
            },
        ],
    };
}

export const HUB = buildHub();
