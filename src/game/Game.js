import { GameLoop } from '../engine/GameLoop.js';
import { EventBus } from '../engine/EventBus.js';
import { InputHandler } from '../engine/Input.js'; // Moved
import { EntityManager } from './EntityManager.js';
import { EncounterManager } from './EncounterManager.js';
import { CONFIG, LEVEL_1_ENCOUNTER } from './Config.js';
import { GameMap } from './map.js';
import { Mech } from './mech.js';
import { Terminal } from './terminal.js';
import { Camera } from './camera.js';
import { Tower } from './tower.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Constants
        this.TILE_SIZE = 40;
        this.WORLD_WIDTH_TILES = 50;
        this.WORLD_HEIGHT_TILES = 50;

        // Engine Systems
        this.eventBus = new EventBus();
        this.loop = new GameLoop(
            (dt) => this.update(dt),
            () => this.draw()
        );
        this.input = new InputHandler(canvas);

        // Game State
        this.gameState = 'PLAYING'; // 'PLAYING', 'GAME_OVER', 'GAME_WIN'
        this.credits = 500;

        // Entities & Systems (Initialized in reset)
        this.map = null;
        this.mech = null;
        this.terminal = null;
        this.camera = null;
        this.entities = null;
        this.encounter = null;

        // Bindings
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('resize', () => this.resizeCanvas());

        this.resizeCanvas();
        this.reset();
    }

    reset() {
        console.log('Resetting Game...');
        this.gameState = 'PLAYING';
        this.credits = 500;

        // 1. Map & Core Entities
        this.map = new GameMap(this.WORLD_WIDTH_TILES, this.WORLD_HEIGHT_TILES, this.TILE_SIZE);

        const cx = (this.map.width * this.TILE_SIZE) / 2;
        const cy = (this.map.height * this.TILE_SIZE) / 2;

        this.mech = new Mech(cx - 100, cy);
        this.terminal = new Terminal(cx, cy);

        // 2. Managers
        this.entities = new EntityManager();
        this.encounter = new EncounterManager(this); // Pass game ref (Director needs it)
        this.encounter.loadEncounter(LEVEL_1_ENCOUNTER);

        // 3. Camera
        this.camera = new Camera(
            this.map.width * this.TILE_SIZE,
            this.map.height * this.TILE_SIZE,
            this.canvas.width,
            this.canvas.height
        );
        this.camera.follow(this.mech);

        this.loop.start();
    }

    start() {
        this.loop.start();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        if (this.camera) {
            this.camera.resize(this.canvas.width, this.canvas.height);
        }
    }

    onKeyDown(e) {
        if ((this.gameState === 'GAME_OVER' || this.gameState === 'GAME_WIN') && e.key.toLowerCase() === 'r') {
            this.reset();
        }
        if (this.gameState === 'PLAYING' && e.key === 'k') { // Debug Kill, only when playing
            this.terminal.takeDamage(100);
        }
    }

    update(dt) {
        if (this.gameState === 'GAME_OVER' || this.gameState === 'GAME_WIN') return;

        // 1. Check Loss
        if (this.terminal.hp <= 0 || this.mech.hp <= 0) { // Added Mech HP check for completeness
            this.gameState = 'GAME_OVER';
            return;
        }

        // 2. Input & Context
        const movement = this.input.getMovementVector();
        const mouseWorld = this.input.getMouseWorld(this.camera);
        const grid = this.input.getMouseGrid(this.camera, this.TILE_SIZE);
        const hoveringSocket = this.map.isBuildable(grid.col, grid.row);

        // 3. Construction Logic
        // TODO: Move this out to a ConstructionManager or similar if it grows
        if (this.input.mouse.isDown && !this.clickProcessed) {
            this.clickProcessed = true;
            if (hoveringSocket) {
                this.tryBuildTower(grid.col, grid.row);
            }
        }
        if (!this.input.mouse.isDown) this.clickProcessed = false;

        // 4. Mech Update (Weapon Fire)
        const mechInputMouse = { ...mouseWorld };
        if (hoveringSocket) mechInputMouse.isDown = false; // Suppress fire on sockets

        const newProjectile = this.mech.update(dt, movement, mechInputMouse, mouseWorld, this.map);
        if (newProjectile) this.entities.addProjectile(newProjectile);

        // 5. System Updates
        this.camera.follow(this.mech);
        this.encounter.update(dt);
        this.entities.update(dt, this); // Pass Game for context (credits, terminal)
    }

    draw() {
        const ctx = this.ctx;

        // Clear
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // World Space
        ctx.save();
        ctx.translate(-this.camera.x, -this.camera.y);

        this.map.draw(ctx);
        this.drawEncounterOverlay(ctx); // Replaces simple drawPath

        this.terminal.draw(ctx);
        this.entities.draw(ctx);

        // Ghost Preview
        this.drawGhost(ctx);

        this.mech.draw(ctx);

        ctx.restore();

        // UI Layer
        this.drawUI(ctx);
    }

    // Logic Helpers
    addCredits(amount) {
        this.credits += amount;
    }

    tryBuildTower(col, row) {
        const COST = 100;
        if (this.credits < COST) return false;

        if (this.map.isBuildable(col, row)) {
            const t = new Tower(col, row, this.TILE_SIZE);
            if (this.map.addTower(t)) {
                this.entities.addTower(t);
                this.credits -= COST;
                return true;
            }
        }
        return false;
    }

    // Visual Helpers
    drawEncounterOverlay(ctx) {
        if (!this.encounter || !this.map) return;

        ctx.save();
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';

        // 1. Telegraphs (Faded)
        this.encounter.telegraphLanes.forEach(laneId => {
            const path = this.map.getLanePath(laneId);
            if (path.length > 1) {
                // Pulse Effect
                const alpha = 0.2 + Math.sin(Date.now() / 200) * 0.1;
                ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.setLineDash([15, 10]);
                ctx.beginPath();
                ctx.moveTo(path[0].x, path[0].y);
                for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
                ctx.stroke();

                // Draw Portal Indicator (Inactive)
                ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.beginPath();
                ctx.arc(path[0].x, path[0].y, 25, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        });

        // 2. Active Lanes (Solid)
        ctx.setLineDash([]);
        this.encounter.activeLanes.forEach(laneId => {
            const path = this.map.getLanePath(laneId);
            if (path.length > 1) {
                // Check if this lane is currently spawning (Active Portal)
                const isSpawning = this.encounter.activePortals.some(p => p.lane === laneId);

                if (isSpawning) {
                    // Intense Glow & Pulse
                    const pulse = 1.0 + Math.sin(Date.now() / 150) * 0.1;

                    ctx.strokeStyle = '#ff4444';
                    ctx.lineWidth = 3;
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = 'red';

                    ctx.beginPath();
                    ctx.moveTo(path[0].x, path[0].y);
                    for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
                    ctx.stroke();

                    // Draw Portal (Active Spawning) - Big and Animated
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = '#ff0000';
                    ctx.fillStyle = '#aa0000'; // Dark Red Center
                    ctx.beginPath();
                    ctx.arc(path[0].x, path[0].y, 20 * pulse, 0, Math.PI * 2);
                    ctx.fill();

                    // Rim
                    ctx.strokeStyle = '#ff8888';
                    ctx.lineWidth = 4;
                    ctx.stroke();
                } else {
                    // Established Path (Finished Spawning) - Static, Darker Red
                    ctx.strokeStyle = '#880000'; // Dark Red
                    ctx.lineWidth = 3;
                    ctx.shadowBlur = 0; // No glow

                    ctx.beginPath();
                    ctx.moveTo(path[0].x, path[0].y);
                    for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
                    ctx.stroke();

                    // Draw Portal (Inactive/Dormant) - Small, Dark
                    ctx.fillStyle = '#440000';
                    ctx.beginPath();
                    ctx.arc(path[0].x, path[0].y, 15, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#660000';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            }
        });

        ctx.restore();
    }

    drawGhost(ctx) {
        const grid = this.input.getMouseGrid(this.camera, this.TILE_SIZE);
        if (this.map && this.map.isBuildable(grid.col, grid.row)) {
            const x = grid.col * this.TILE_SIZE;
            const y = grid.row * this.TILE_SIZE;
            const canAfford = this.credits >= 100;

            ctx.save();
            ctx.fillStyle = canAfford ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)';
            ctx.fillRect(x, y, this.TILE_SIZE, this.TILE_SIZE);

            ctx.strokeStyle = canAfford ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)';
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(x + this.TILE_SIZE / 2, y + this.TILE_SIZE / 2, 250, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }

    drawUI(ctx) {
        if (this.gameState === 'GAME_OVER') {
            this.drawGameOver(ctx);
            return;
        }
        if (this.gameState === 'GAME_WIN') {
            this.drawWinScreen(ctx);
            return;
        }

        ctx.fillStyle = '#fff';
        ctx.font = '12px Courier New';
        ctx.fillText(`WASD to Move, Click to Fire`, 10, 20);
        ctx.fillText(`Hover Socket -> Click to Build (Cost: 100)`, 10, 35);
        ctx.fillText(`Mech: ${Math.round(this.mech.x)}, ${Math.round(this.mech.y)}`, 10, 50);
        ctx.fillText(`Enemies: ${this.entities.enemies.length}`, 10, 65);
        ctx.fillText(`Terminal HP: ${this.terminal.hp}/${this.terminal.maxHp}`, 10, 80);

        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 20px Courier New';
        ctx.fillText(`CREDITS: ${this.credits}`, 10, 110);
    }

    drawGameOver(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.fillStyle = '#f00';
        ctx.font = '48px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);

        ctx.fillStyle = '#fff';
        ctx.font = '24px Courier New';
        ctx.fillText('Terminal Destroyed', this.canvas.width / 2, this.canvas.height / 2 + 50);
        ctx.fillText('Press R to Restart', this.canvas.width / 2, this.canvas.height / 2 + 80);
        ctx.textAlign = 'start';
    }

    triggerWin() {
        if (this.gameState !== 'PLAYING') return;
        this.gameState = 'GAME_WIN';
        console.log('VICTORY!');
    }

    drawWinScreen(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.fillStyle = '#0f0';
        ctx.font = '48px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('MISSION COMPLETE', this.canvas.width / 2, this.canvas.height / 2);

        ctx.fillStyle = '#fff';
        ctx.font = '24px Courier New';
        // ctx.fillText(`Credits Earned: ${this.credits}`, this.canvas.width / 2, this.canvas.height / 2 + 50);
        ctx.fillText('Press R to Restart', this.canvas.width / 2, this.canvas.height / 2 + 80);
        ctx.textAlign = 'start';
    }
}
