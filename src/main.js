/**
 * Mech TD Prototype v0 Entry Point
 */

console.log('Initializing Mech TD Prototype v0...');

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Placeholder Game Loop
function gameLoop() {
    // Clear screen
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw placeholder text
    ctx.fillStyle = '#0f0';
    ctx.font = '24px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('Mech TD Prototype v0', canvas.width / 2, canvas.height / 2);
    ctx.fillStyle = '#aaa';
    ctx.font = '16px Courier New';
    ctx.fillText('System Initialized', canvas.width / 2, canvas.height / 2 + 30);

    requestAnimationFrame(gameLoop);
}

// Start loop
gameLoop();
