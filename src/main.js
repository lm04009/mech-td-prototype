import { AppManager } from './engine/AppManager.js';
import { DataStore } from './data/DataStore.js';
import { CONFIG } from './game/Config.js';
import { PlayerProfile } from './game/PlayerProfile.js';
import { BaseScene } from './game/BaseScene.js';

console.log('Initializing Mech TD Prototype (AppManager)...');

const canvas = document.getElementById('game-canvas');

// Load all JSON data first, then start the game
DataStore.load().then(() => {
    // Seed runtime constants from data
    CONFIG.INTRA_BURST_INTERVAL_MS = DataStore.getConstant('IntraBurstInterval', 50);

    const appManager = new AppManager(canvas, DataStore);

    appManager.switchScene(new BaseScene());

    appManager.start();
}).catch(err => {
    console.error('[DataStore] Failed to load game data:', err);
});
