import { BaseComponent } from '../BaseComponent.js';

export class HUD extends BaseComponent {
    constructor(uiManager) {
        super(uiManager);
        this.healthBar = null;
        this.creditsDisplay = null;
        this.enemyCountDisplay = null;
        this.terminalHealthDisplay = null;
    }

    onMount(container) {
        container.classList.add('hud-panel');
        // We might want separate panels for top-left, top-right etc.
        // For now, let's just make a simple overlay that positions itself?
        // Actually, CSS Grid in #ui-layer handles layout. 
        // We should probably mount 3 separate panels? 
        // Or one HUD component that appends multiple children to different grid areas?

        // Let's try appending children to the main container (which is #ui-layer)
        // But BaseComponent mounts to a container. 
        // If UIManager sets HUD, it mounts it to #ui-layer.
        // So this.container is a div in #ui-layer.
        // We can style this.container to display: contents or use grid areas directly if it was a direct child.
        // But it's a div wrapper.

        // Let's make this.container take up the whole grid? 
        // Or just put specific stats in top-left?

        // Let's implement a "TopLeftPanel" for now.
        this.container.style.gridArea = 'top-left';
        this.container.style.pointerEvents = 'none'; // HUD shouldn't block clicks usually

        // Health Bar
        const hpContainer = document.createElement('div');
        hpContainer.className = 'health-bar-container';
        this.healthBar = document.createElement('div');
        this.healthBar.className = 'health-bar-fill';
        this.healthBar.style.width = '100%';
        hpContainer.appendChild(this.healthBar);

        const hpLabel = document.createElement('div');
        hpLabel.textContent = 'MECH INTEGRITY';
        this.container.appendChild(hpLabel);
        this.container.appendChild(hpContainer);

        // Credits
        this.creditsDisplay = document.createElement('div');
        this.creditsDisplay.style.marginTop = '10px';
        this.creditsDisplay.style.color = '#fc0';
        this.creditsDisplay.style.fontSize = '20px';
        this.creditsDisplay.textContent = 'CR: 0';
        this.container.appendChild(this.creditsDisplay);

        // Enemies
        this.enemyCountDisplay = document.createElement('div');
        this.enemyCountDisplay.textContent = 'Hostiles: 0';
        this.container.appendChild(this.enemyCountDisplay);

        // Terminal
        this.terminalHealthDisplay = document.createElement('div');
        this.terminalHealthDisplay.textContent = 'Terminal: 100%';
        this.container.appendChild(this.terminalHealthDisplay);

        // Event Listeners
        // We need access to game events.
        // UIManager > Game > EventBus
        const bus = this.uiManager.game.eventBus;

        bus.on('mech:damage', (data) => this.updateHealth(data));
        bus.on('mech:heal', (data) => this.updateHealth(data));
        bus.on('credits:change', (amount) => this.updateCredits(amount));
        bus.on('terminal:damage', (data) => this.updateTerminal(data));
        bus.on('gameloop:update', (data) => this.updateLoop(data)); // If we need per frame
    }

    updateHealth(data) {
        if (!this.healthBar) return;
        const pct = Math.max(0, (data.hp / data.maxHp) * 100);
        this.healthBar.style.width = `${pct}%`;
        this.healthBar.style.backgroundColor = pct > 30 ? '#0f0' : '#f00';
    }

    updateCredits(amount) {
        if (this.creditsDisplay) {
            this.creditsDisplay.textContent = `CR: ${amount}`;
        }
    }

    updateTerminal(data) {
        if (this.terminalHealthDisplay) {
            const pct = Math.floor((data.hp / data.maxHp) * 100);
            this.terminalHealthDisplay.textContent = `Terminal: ${pct}%`;
            this.terminalHealthDisplay.style.color = pct > 50 ? '#fff' : '#f00';
        }
    }

    // Polling fallback if events aren't fully ready yet
    update(dt) {
        // Can read from game directly if needed
        const game = this.uiManager.game;
        if (game.entities) {
            this.enemyCountDisplay.textContent = `Hostiles: ${game.entities.enemies.length}`;
        }

        // Fallback init
        if (game.mech && this.healthBar.style.width === '100%' && game.mech.hp < game.mech.maxHp) {
            this.updateHealth({ hp: game.mech.hp, maxHp: game.mech.maxHp });
        }

        if (game.credits !== undefined) {
            this.updateCredits(game.credits);
        }
    }
}
