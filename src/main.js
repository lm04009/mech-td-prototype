import { Game } from './game/Game.js';
import { DataStore } from './data/DataStore.js';

console.log('Initializing Mech TD Prototype v0 (Refactored)...');

const canvas = document.getElementById('game-canvas');

// Load all JSON data first, then start the game
DataStore.load().then(() => {
    const game = new Game(canvas, DataStore);
    game.start();
}).catch(err => {
    console.error('[DataStore] Failed to load game data:', err);
});

// Handle Window Resize globally or let Game handle it?
// Game handles it internally in its constructor event listeners.
