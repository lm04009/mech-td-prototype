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

        // Mech Parts Health
        this.partBars = {};

        const partsContainer = document.createElement('div');
        partsContainer.style.marginBottom = '10px';
        partsContainer.style.background = 'rgba(0,0,0,0.5)';
        partsContainer.style.padding = '5px';
        partsContainer.style.border = '1px solid #444';

        const partsLabel = document.createElement('div');
        partsLabel.textContent = 'MECH STATUS';
        partsLabel.style.color = '#fff';
        partsLabel.style.marginBottom = '5px';
        partsLabel.style.fontWeight = 'bold';
        partsContainer.appendChild(partsLabel);

        const partKeys = ['body', 'armLeft', 'armRight', 'legs'];
        const partNames = ['Body', 'Left Arm', 'Right Arm', 'Legs'];

        partKeys.forEach((key, index) => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.marginBottom = '4px';

            const label = document.createElement('div');
            label.textContent = partNames[index];
            label.style.width = '80px';
            label.style.fontSize = '12px';
            label.style.color = '#ddd';

            const barContainer = document.createElement('div');
            barContainer.className = 'health-bar-container';
            barContainer.style.flexGrow = '1';
            barContainer.style.height = '12px';
            barContainer.style.margin = '0 5px';
            barContainer.style.background = '#333';

            const barFill = document.createElement('div');
            barFill.className = 'health-bar-fill';
            barFill.style.width = '100%';
            barFill.style.height = '100%';
            barFill.style.backgroundColor = '#0f0';
            barFill.style.transition = 'width 0.2s, background-color 0.2s';

            const textHp = document.createElement('div');
            textHp.textContent = '--';
            textHp.style.width = '30px';
            textHp.style.fontSize = '12px';
            textHp.style.textAlign = 'right';
            textHp.style.color = '#fff';

            barContainer.appendChild(barFill);
            row.appendChild(label);
            row.appendChild(barContainer);
            row.appendChild(textHp);

            partsContainer.appendChild(row);

            this.partBars[key] = { fill: barFill, text: textHp };
        });

        this.container.appendChild(partsContainer);

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
        if (!this.partBars || !data.parts) return;

        Object.keys(this.partBars).forEach(key => {
            if (data.parts[key]) {
                const part = data.parts[key];
                const pct = Math.max(0, (part.hp / part.maxHp) * 100);
                const bar = this.partBars[key];

                bar.fill.style.width = `${pct}%`;
                bar.fill.style.backgroundColor = pct > 50 ? '#0f0' : (pct > 25 ? '#ff0' : '#f00');
                bar.text.textContent = `${Math.ceil(part.hp)}`;
            }
        });
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
        if (game.mech && game.mech.parts && this.partBars && this.partBars.body.text.textContent === '--') {
            this.updateHealth({ parts: game.mech.parts });
        }

        if (game.credits !== undefined) {
            this.updateCredits(game.credits);
        }
    }
}
