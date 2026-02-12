import { InputHandler } from './game/input.js';
import { Mech } from './game/mech.js';
import { GameMap } from './game/map.js';
import { Terminal } from './game/terminal.js';
import { Enemy } from './game/enemy.js';
import { Camera } from './game/camera.js';
import { Tower } from './game/tower.js';

console.log('Initializing Mech TD Prototype v0...');

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
let camera; // Declare early to avoid TDZ

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (camera) {
        camera.resize(canvas.width, canvas.height);
    }
}

window.addEventListener('resize', () => {
    resizeCanvas();
    // No reset needed anymore!
});
resizeCanvas();

// Game State Enum
const GameState = {
    PLAYING: 'PLAYING',
    GAME_OVER: 'GAME_OVER'
};

const TILE_SIZE = 40;
const input = new InputHandler(canvas);
// Game Variables
let currentState;
let mech;
let terminal;
let projectiles;
let enemies;
let spawnTimer;
let map;
let enemyPath;
let credits = 500; // Starting Credits
let towers = [];
let constructionMode = false;
let clickProcessed = false; // Debounce click

// Fixed World Size
const WORLD_WIDTH_TILES = 50;
const WORLD_HEIGHT_TILES = 50;

function resetGame() {
    currentState = GameState.PLAYING;

    // Fixed Map Size
    map = new GameMap(WORLD_WIDTH_TILES, WORLD_HEIGHT_TILES, TILE_SIZE);

    // Terminal at World Center
    const cx = (map.width * TILE_SIZE) / 2;
    const cy = (map.height * TILE_SIZE) / 2;

    mech = new Mech(cx - 100, cy);
    terminal = new Terminal(cx, cy);

    // Initialize Camera
    camera = new Camera(
        map.width * TILE_SIZE,
        map.height * TILE_SIZE,
        canvas.width,
        canvas.height
    );
    camera.follow(mech);

    // Generate Path based on NEW terminal position
    // Water is approx at x: [cx-15, cx-10], y: [cy-5, cy+5]
    // We route ABOVE the water.
    enemyPath = [
        { x: 0, y: cy - (7 * TILE_SIZE) }, // Start Top-Left
        { x: cx - (8 * TILE_SIZE), y: cy - (7 * TILE_SIZE) }, // Go past water
        { x: cx - (8 * TILE_SIZE), y: cy }, // Go Down
        { x: cx, y: cy } // Terminal
    ];

    projectiles = [];
    enemies = [];
    towers = [];
    spawnTimer = 0;
    credits = 500;

    console.log(`Game Reset. Map: ${map.width}x${map.height}, Terms: ${terminal.x},${terminal.y}`);
}

// Initial Start
resetGame();



// Wave State
const SPAWN_INTERVAL = 2; // Seconds

// Input: Restart & Debug
window.addEventListener('keydown', (e) => {
    if (currentState === GameState.GAME_OVER && e.key.toLowerCase() === 'r') {
        resetGame();
    }

    if (e.key === 'k') {
        terminal.takeDamage(100);
        console.log(`Terminal HP: ${terminal.hp}`);
        terminal.takeDamage(100);
        console.log(`Terminal HP: ${terminal.hp}`);
    }

    if (e.key.toLowerCase() === 'b') {
        constructionMode = !constructionMode;
    }
});

let lastTime = 0;

// Game Loop
function gameLoop(timestamp) {
    let dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    // Cap dt to prevent "spiral of death" when tab is inactive
    if (dt > 0.1) dt = 0.1;

    switch (currentState) {
        case GameState.PLAYING:
            updatePlaying(dt);
            drawPlaying(ctx);
            break;
        case GameState.GAME_OVER:
            drawPlaying(ctx); // Draw game behind overlay
            drawGameOver(ctx);

            // Check Restart Input
            // (Ideally input handling should be in its own function, but for v0 implementation this is fine)
            // We'll add the listener elsewhere, but this connects the state.
            break;
    }

    requestAnimationFrame(gameLoop);
}

function updatePlaying(dt) {
    // Check Game Over
    if (terminal.hp <= 0) {
        currentState = GameState.GAME_OVER;
        return;
    }

    // Spawn Enemies
    spawnTimer += dt;
    if (spawnTimer >= SPAWN_INTERVAL) {
        spawnTimer = 0;
        enemies.push(new Enemy(enemyPath));
    }

    // Update Mech & Fire
    const movement = input.getMovementVector();

    // Get Mouse in World Space
    const mouseWorld = input.getMouseWorld(camera);

    const newProjectile = mech.update(dt, movement, mouseWorld, mouseWorld, map);

    if (newProjectile) {
        projectiles.push(newProjectile);
    }

    // Update Camera
    camera.follow(mech);

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

                    if (enemy.hp <= 0) {
                        addCredits(enemy.bounty);
                    }
                    break;
                }
            }
        }

        if (p.markedForDeletion) {
            projectiles.splice(i, 1);
        }
    }

    // Update Towers
    for (const tower of towers) {
        const p = tower.update(dt, enemies, map);
        if (p) {
            projectiles.push(p);
        }
    }

    // Handle Building Input
    handleConstruction();
}

function handleConstruction() {
    // Debouce click (only build on fresh click)
    const mouseState = input.getMouseWorld(camera);

    if (mouseState.isDown && !clickProcessed) {
        clickProcessed = true;

        if (constructionMode) {
            const grid = input.getMouseGrid(camera, TILE_SIZE);
            tryBuildTower(grid.col, grid.row);
        } else {
            // Main weapon fire is handled in mech.update()
        }
    }

    if (!mouseState.isDown) {
        clickProcessed = false;
    }
}

function tryBuildTower(col, row) {
    // 1. Check Cost
    const COST = 100;
    if (credits < COST) return;

    // 2. Check Map Validity (Socket + Empty)
    if (map.isBuildable(col, row)) {
        const t = new Tower(col, row, TILE_SIZE);
        if (map.addTower(t)) {
            towers.push(t);
            spendCredits(COST);
            // constructionMode = false; // Keep mode on for multiple builds
        }
    }
}

function drawPlaying(ctx) {
    // Clear Screen (Screen Space)
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Start World Space
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

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

    // Draw Towers
    towers.forEach(t => t.draw(ctx));

    // Draw Ghost (if building)
    if (constructionMode) {
        const grid = input.getMouseGrid(camera, TILE_SIZE);
        const x = grid.col * TILE_SIZE;
        const y = grid.row * TILE_SIZE;

        const canBuild = map.isBuildable(grid.col, grid.row) && credits >= 100;

        ctx.save();
        ctx.fillStyle = canBuild ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

        // Range indicator
        ctx.strokeStyle = canBuild ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 250, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    // Draw Mech
    mech.draw(ctx);

    // Restore Screen Space
    ctx.restore();

    // Debug Info (UI)
    ctx.fillStyle = '#fff';
    ctx.font = '12px Courier New';
    ctx.fillText(`WASD to Move, Click to Fire, 'B' to Build`, 10, 20);
    ctx.fillText(`Mech: ${Math.round(mech.x)}, ${Math.round(mech.y)}`, 10, 35);
    ctx.fillText(`Cam: ${Math.round(camera.x)}, ${Math.round(camera.y)}`, 10, 50);
    ctx.fillText(`Enemies: ${enemies.length}`, 10, 65);
    ctx.fillText(`Enemies: ${enemies.length}`, 10, 65);
    ctx.fillText(`Terminal HP: ${terminal.hp}/${terminal.maxHp}`, 10, 80);

    // Credits UI
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 20px Courier New';
    ctx.fillText(`CREDITS: ${credits} ${constructionMode ? '[BUILD MODE]' : ''}`, 10, 110);
}

// Economy Helpers
function addCredits(amount) {
    credits += amount;
}

function spendCredits(amount) {
    if (credits >= amount) {
        credits -= amount;
        return true;
    }
    return false;
}

function drawPath(ctx) {
    if (!enemyPath || enemyPath.length < 2) return;

    ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(enemyPath[0].x, enemyPath[0].y);
    for (let i = 1; i < enemyPath.length; i++) {
        ctx.lineTo(enemyPath[i].x, enemyPath[i].y);
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
    ctx.fillText('Press R to Restart', canvas.width / 2, canvas.height / 2 + 80);
}

// Start loop
requestAnimationFrame(gameLoop);
