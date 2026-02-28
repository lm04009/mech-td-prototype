import { GameLoop } from './GameLoop.js';
import { EventBus } from './EventBus.js';
import { InputHandler } from './Input.js';
import { UIManager } from '../ui/UIManager.js';
import { HUD } from '../ui/components/HUD.js';
import { GameOverScreen } from '../ui/screens/GameOverScreen.js';
import { GameWinScreen } from '../ui/screens/GameWinScreen.js';
import { PauseScreen } from '../ui/screens/PauseScreen.js';

export class AppManager {
    constructor(canvas, dataStore) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.dataStore = dataStore;

        // Engine Systems
        this.eventBus = new EventBus();
        this.input = new InputHandler(canvas);

        // UI System
        // Pass 'this' (AppManager) so UIManager can control global screens
        this.uiManager = new UIManager(this);
        this.uiManager.setHUD(new HUD(this.uiManager));
        this.uiManager.registerScreen('GameOver', new GameOverScreen(this.uiManager));
        this.uiManager.registerScreen('GameWin', new GameWinScreen(this.uiManager));
        this.uiManager.registerScreen('Pause', new PauseScreen(this.uiManager));

        // Game Loop
        this.loop = new GameLoop(
            (dt) => this.update(dt),
            () => this.draw()
        );

        this.currentScene = null;

        window.addEventListener('resize', () => this.resizeCanvas());
        this.resizeCanvas();
    }

    start() {
        this.loop.start();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        if (this.currentScene && this.currentScene.resizeCanvas) {
            this.currentScene.resizeCanvas(this.canvas.width, this.canvas.height);
        }
    }

    switchScene(newScene) {
        if (this.currentScene) {
            if (this.currentScene.leave) {
                this.currentScene.leave();
            }
        }

        this.currentScene = newScene;

        // Clear UI screens on scene change
        if (this.uiManager) {
            this.uiManager.hideScreen();
        }

        if (this.currentScene) {
            if (this.currentScene.enter) {
                this.currentScene.enter(this);
            }
        }
    }

    update(dt) {
        if (this.currentScene && this.currentScene.update) {
            this.currentScene.update(dt);
        }

        // UIManager updates (e.g., animations)
        if (this.uiManager) {
            this.uiManager.update(dt);
        }
    }

    draw() {
        // We let the scene clear the canvas or draw a background
        // Wait, maybe the app manager clears it? Let's leave it to the scene or clear here.
        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.currentScene && this.currentScene.draw) {
            this.currentScene.draw(this.ctx);
        }
    }
}
