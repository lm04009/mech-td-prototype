import { GameMap, TERRAIN } from './src/game/map.js';

// Mock Canvas/Context if needed (likely not for logic)
// But GameMap might not need it.

console.log('Starting Lane Generator Verification...');

try {
    const map = new GameMap(50, 50, 40);
    console.log('Map initialized.');

    const lanes = map.getAllLanes();
    const laneIds = Object.keys(lanes);

    console.log(`Generated ${laneIds.length} lanes.`);
    console.log(`- Center (25, 25): ${map.tiles[25][25]}`);
    console.log(`- North Start (25, 2): ${map.tiles[2][25]}`);
    console.log(`- North Gate (25, 17): ${map.tiles[17][25]}`);


    for (const id of laneIds) {
        const lane = lanes[id];
        const pathLen = lane.path.length;
        const socketCount = lane.sockets.length;

        console.log(`\nLane [${id}]:`);
        console.log(`  - Path Length: ${pathLen}`);
        console.log(`  - Sockets: ${socketCount}`);

        // Validation Logic
        if (pathLen === 0) console.error('  ERROR: Path length is 0');

        // Check Min Sockets
        if (socketCount < 2) console.warn('  WARNING: Sockets below MIN (2)');

        // Check Max Sockets
        if (socketCount > 10) console.warn('  WARNING: Sockets above MAX (10)');

        // Check placement valid (roughly)
        // We can't easily check visual placement without map data inspection
        // But we can check if sockets are marked in tiles

        let validSockets = 0;
        for (const s of lane.sockets) {
            // Map stores sockets as HIDDEN_SOCKET initially
            const type = map.tiles[s.y][s.x];
            if (type === TERRAIN.HIDDEN_SOCKET) {
                validSockets++;
            } else {
                console.error(`  ERROR: Socket at ${s.x},${s.y} is type ${type}, expected HIDDEN_SOCKET (4)`);
            }
        }
        console.log(`  - Validated Sockets on Map: ${validSockets}/${socketCount}`);

        // Test Unlock
        console.log(`  - Testing Unlock...`);
        map.unlockLaneSockets(id);

        let unlockedSockets = 0;
        for (const s of lane.sockets) {
            const type = map.tiles[s.y][s.x];
            if (type === TERRAIN.SOCKET) {
                unlockedSockets++;
            }
        }
        console.log(`  - Unlocked Sockets: ${unlockedSockets}/${socketCount}`);
    }

} catch (e) {
    console.error('CRITICAL ERROR during verification:', e);
}
