export const CONFIG = {
    TILE_SIZE: 40,
    TELEGRAPH_DURATION: 5, // Seconds
};

export const LEVEL_1_ENCOUNTER = [
    {
        lane: 'NORTH',
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
    }
];
