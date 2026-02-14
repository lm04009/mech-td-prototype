export const CONFIG = {
    TILE_SIZE: 40,
    TELEGRAPH_DURATION: 5, // Seconds
};

export const LEVEL_1_ENCOUNTER = [
    {
        lane: 'WEST', // Complex Path
        startTime: 5,
        count: 10,
        interval: 1.5,
        enemyType: 'BASIC'
    },
    {
        lane: 'EAST',
        startTime: 12, // Overlap with North
        count: 15,
        interval: 1.2,
        enemyType: 'BASIC'
    },
    {
        lane: 'NORTH',
        startTime: 18,
        count: 10,
        interval: 1.5,
        enemyType: 'BASIC'
    },
    {
        lane: 'SOUTH',
        startTime: 25,
        count: 10,
        interval: 1.5,
        enemyType: 'BASIC'
    },
    {
        lane: 'CUSTOM',
        startTime: 30, // Late wave
        count: 20,     // Heavy wave
        interval: 1.0,
        enemyType: 'BASIC'
    }
];
