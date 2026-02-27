export const CONFIG = {
    TILE_SIZE: 40,
    TELEGRAPH_DURATION: 5, // Seconds
    FACTION: {
        PLAYER: 'PLAYER',
        ENEMY: 'ENEMY'
    },

    // Base movement speed for the Mech (pixels/sec), before weight/efficiency formula
    MECH_BASE_SPEED: 200,

    // Fan (shotgun) spread angle in degrees, distributed across all pellets
    FAN_SPREAD_DEGREES: 20,

    // Shield active window duration in ms.
    // TODO: This should eventually come from weapon data (e.g. a 'Duration' field in weapons.json).
    SHIELD_ACTIVE_DURATION_MS: 5000,

    // Slot ring colors for range display
    SLOT_COLORS: {
        armLeft_grip: 'rgba(255, 255,   0, 0.18)', // yellow
        armRight_grip: 'rgba(  0, 255, 255, 0.18)', // cyan
        armLeft_shoulder: 'rgba(255, 128,   0, 0.18)', // orange
        armRight_shoulder: 'rgba(128,   0, 255, 0.18)', // purple
    },

    /**
     * Starting mech loadout.
     * IDs reference parts.json and weapons.json.
     * Slot value null = slot is empty.
     */
    STARTING_LOADOUT: {
        body: { partType: 'Body', id: 11001 },  // Body A
        armLeft: { partType: 'Arm', id: 12001 },  // Arm A
        armRight: { partType: 'Arm', id: 12001 },  // Arm A
        legs: { partType: 'Legs', id: 13001 },  // Legs A (Bipedal)
        slots: {
            armLeft: { grip: 21006, shoulder: 22003 }, // Rifle A + Missile Launcher A
            armRight: { grip: 21003, shoulder: 22001 }, // Machinegun A + Light Shield
        }
    }
};

export const LEVEL_1_ENCOUNTER = [
    {
        lane: 'WEST', // Complex Path
        startTime: 5,
        count: 10,
        interval: 1.5,
        enemyType: 'Enemy A'
    },
    {
        lane: 'EAST',
        startTime: 12, // Overlap with North
        count: 15,
        interval: 1.2,
        enemyType: 'Enemy A'
    },
    {
        lane: 'NORTH',
        startTime: 18,
        count: 10,
        interval: 1.5,
        enemyType: 'Enemy B'
    },
    {
        lane: 'SOUTH',
        startTime: 25,
        count: 10,
        interval: 1.5,
        enemyType: 'Enemy B'
    },
    {
        lane: 'CUSTOM',
        startTime: 30, // Late wave
        count: 20,     // Heavy wave
        interval: 1.0,
        enemyType: 'Enemy C'
    }
];
