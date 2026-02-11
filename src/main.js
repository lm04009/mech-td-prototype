/**
 * Mech TD Prototype v0 Entry Point
 */
import { InputHandler } from './game/input.js';
import { Mech } from './game/mech.js';

console.log('Initializing Mech TD Prototype v0...');

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Game State
const input = new InputHandler();
const mech = new Mech(canvas.width / 2, canvas.height / 2);

let lastTime = 0;

// Game Loop
function gameLoop(timestamp) {
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    // Update
    const movement = input.getMovementVector();
    mech.update(dt, movement);

    // Render
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height); // Clear screen

    // Grid (Visual reference for movement)
    drawGrid(ctx);

    mech.draw(ctx);

    // Debug Info
    ctx.fillStyle = '#fff';
    ctx.font = '12px Courier New';
    ctx.fillText(`WASD to Move`, 10, 20);
    ctx.fillText(`Pos: ${Math.round(mech.x)}, ${Math.round(mech.y)}`, 10, 35);

    requestAnimationFrame(gameLoop);
}

function drawGrid(ctx) {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < canvas.width; x += 50) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
    }
    for (let y = 0; y < canvas.height; y += 50) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();
}

// Start loop
requestAnimationFrame(gameLoop);
