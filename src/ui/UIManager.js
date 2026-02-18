export class UIManager {
    constructor(game) {
        this.game = game;
        this.uiLayer = document.getElementById('ui-layer');
        this.screens = new Map();
        this.currentScreen = null;
        this.hud = null;

        // Ensure we have the base style
        this.uiLayer.classList.add('hud-layout');

        // Listen to Game State
        if (this.game.eventBus) {
            this.game.eventBus.on('game:over', () => this.showScreen('GameOver'));
            this.game.eventBus.on('game:win', () => this.showScreen('GameWin')); // Need to create GameWin or reuse GameOver logic
            this.game.eventBus.on('game:reset', () => this.hideScreen());
        }
    }

    /**
     * Register a screen instance.
     * @param {string} name 
     * @param {BaseScreen} screenInstance 
     */
    registerScreen(name, screenInstance) {
        this.screens.set(name, screenInstance);
    }

    /**
     * Set the persistent HUD component.
     * @param {Object} hudComponent - Should implement mount/unmount/update
     */
    setHUD(hudComponent) {
        if (this.hud) this.hud.unmount();
        this.hud = hudComponent;
        this.hud.mount(this.uiLayer);
    }

    /**
     * Switch to a registered screen.
     * @param {string} name 
     * @param {Object} props - Optional data to pass
     */
    showScreen(name, props = {}) {
        if (this.currentScreen) {
            this.currentScreen.unmount();
            this.currentScreen = null;
        }

        const screen = this.screens.get(name);
        if (screen) {
            this.currentScreen = screen;
            screen.mount(this.uiLayer, props); // Pass props potentially? BaseScreen doesn't take props yet in mount, let's just stick to init or update manually.
            // Actually, might be useful to pass props to `onMount` or similar. 
            // For now, let's keep it simple.
        } else {
            console.warn(`Screen '${name}' not found.`);
        }
    }

    hideScreen() {
        if (this.currentScreen) {
            this.currentScreen.unmount();
            this.currentScreen = null;
        }
    }

    update(dt) {
        if (this.hud) this.hud.update(dt);
        if (this.currentScreen) this.currentScreen.update(dt);
    }
}
