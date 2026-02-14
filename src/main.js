import { Game } from './game/Game.js';

console.log('Initializing Mech TD Prototype v0 (Refactored)...');

const canvas = document.getElementById('game-canvas');

// Create and start the Game
const game = new Game(canvas);
game.start();

// Handle Window Resize globally or let Game handle it?
// Game handles it internally in its constructor event listeners.
