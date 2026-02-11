import { InputHandler } from './game/input.js';
import { Mech } from './game/mech.js';
import { GameMap } from './game/map.js';
import { Terminal } from './game/terminal.js';
import { Enemy } from './game/enemy.js';

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
const TILE_SIZE = 40;
const map = new GameMap(Math.ceil(window.innerWidth / TILE_SIZE), Math.ceil(window.innerHeight / TILE_SIZE), TILE_SIZE);
const input = new InputHandler(canvas);
const mech = new Mech(canvas.width / 2 - 100, canvas.height / 2);
const terminal = new Terminal(canvas.width / 2, canvas.height / 2);
let projectiles = [];
let enemies = [];
let gameOver = false;

// Path Definition (Top-Left -> Center)
const ENEMY_PATH = [
    { x: 0, y: 0 },
    { x: 400, y: 0 },
    { x: 400, y: 200 },
    { x: terminal.x, y: terminal.y }
];

// Wave State
let spawnTimer = 0;
const SPAWN_INTERVAL = 2; // Seconds

// Debug: Kill Terminal
window.addEventListener('keydown', (e) => {
    if (e.key === 'k') {
        terminal.takeDamage(100);
        console.log(`Terminal HP: ${terminal.hp}`);
    }
});

let lastTime = 0;

// Game Loop
function gameLoop(timestamp) {
    if (gameOver) return;

    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    // Check Game Over
    if (terminal.hp <= 0) {
        gameOver = true;
        drawGameOver(ctx);
        return;
    }

    // Spawn Enemies
    spawnTimer += dt;
    if (spawnTimer >= SPAWN_INTERVAL) {
        spawnTimer = 0;
        enemies.push(new Enemy(ENEMY_PATH));
    }

    // Update Mech & Fire
    const movement = input.getMovementVector();
    const newProjectile = mech.update(dt, movement, input.mouse, input.mouse, map);

    if (newProjectile) {
        projectiles.push(newProjectile);
    }

    // Update Enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.update(dt);

        // Terminal Damage
        if (enemy.reachedEnd) {
            terminal.takeDamage(enemy.damage);
        }

        if (enemy.markedForDeletion) {
            enemies.splice(i, 1);
        }
    }

    // Update Projectiles & Collision
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.update(dt, map);

        // Check collision with enemies
        if (!p.markedForDeletion) {
            for (const enemy of enemies) {
                const dx = p.x - enemy.x;
                const dy = p.y - enemy.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < (p.size + enemy.size / 2)) {
                    enemy.takeDamage(10); // Simple damage
                    p.markedForDeletion = true;
                    break;
                }
            }
        }

        if (p.markedForDeletion) {
            projectiles.splice(i, 1);
        }
    }

    // Render
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height); // Clear screen

    // Draw Map
    map.draw(ctx);

    // Draw Path
    drawPath(ctx);

    // Draw Terminal
    terminal.draw(ctx);

    // Draw Enemies
    enemies.forEach(e => e.draw(ctx));

    // Draw Projectiles
    projectiles.forEach(p => p.draw(ctx));

    // Draw Mech
    mech.draw(ctx);

    // Debug Info
    ctx.fillStyle = '#fff';
    ctx.font = '12px Courier New';
    ctx.fillText(`WASD to Move, Click to Fire`, 10, 20);
    ctx.fillText(`Pos: ${Math.round(mech.x)}, ${Math.round(mech.y)}`, 10, 35);
    ctx.fillText(`Projectiles: ${projectiles.length}`, 10, 50);
    ctx.fillText(`Enemies: ${enemies.length}`, 10, 65);
    ctx.fillText(`Terminal HP: ${terminal.hp}/${terminal.maxHp}`, 10, 80);

    requestAnimationFrame(gameLoop);
}

function drawPath(ctx) {
    if (ENEMY_PATH.length < 2) return;

    ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(ENEMY_PATH[0].x, ENEMY_PATH[0].y);
    for (let i = 1; i < ENEMY_PATH.length; i++) {
        ctx.lineTo(ENEMY_PATH[i].x, ENEMY_PATH[i].y);
    }
    ctx.stroke();
}

function drawGameOver(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#f00';
    ctx.font = '48px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);

    ctx.fillStyle = '#fff';
    ctx.font = '24px Courier New';
    ctx.fillText('Terminal Destroyed', canvas.width / 2, canvas.height / 2 + 50);
}

// Start loop
requestAnimationFrame(gameLoop);
