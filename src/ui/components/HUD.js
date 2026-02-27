import { BaseComponent } from '../BaseComponent.js';
import { CONFIG } from '../../game/Config.js';

export class HUD extends BaseComponent {
    constructor(uiManager) {
        super(uiManager);
        this.healthBar = null;
        this.creditsDisplay = null;
        this.enemyCountDisplay = null;
        this.terminalHealthDisplay = null;
        this.slotEls = {}; // weapon slot UI references
    }

    onMount(container) {
        container.classList.add('hud-panel');
        this.container.style.gridArea = 'top-left';
        this.container.style.pointerEvents = 'none';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.gap = '8px';

        // ── MECH STATUS ──────────────────────────────────────────────────────
        this.partBars = {};

        const partsContainer = document.createElement('div');
        partsContainer.className = 'hud-sub-panel';

        const partsLabel = document.createElement('div');
        partsLabel.textContent = 'MECH STATUS';
        partsLabel.className = 'hud-section-label';
        partsContainer.appendChild(partsLabel);

        const partKeys = ['body', 'armLeft', 'armRight', 'legs'];
        const partNames = ['Body', 'Left Arm', 'Right Arm', 'Legs'];

        partKeys.forEach((key, index) => {
            const row = document.createElement('div');
            row.className = 'hud-bar-row';

            const label = document.createElement('span');
            label.textContent = partNames[index];
            label.className = 'hud-bar-label';

            const barOuter = document.createElement('div');
            barOuter.className = 'hud-bar-outer';

            const barFill = document.createElement('div');
            barFill.className = 'hud-bar-fill';

            const textHp = document.createElement('span');
            textHp.className = 'hud-bar-value';
            textHp.textContent = '--';

            barOuter.appendChild(barFill);
            row.appendChild(label);
            row.appendChild(barOuter);
            row.appendChild(textHp);
            partsContainer.appendChild(row);

            this.partBars[key] = { fill: barFill, text: textHp };
        });

        this.container.appendChild(partsContainer);

        // ── WEAPONS PANEL ────────────────────────────────────────────────────
        const weaponsContainer = document.createElement('div');
        weaponsContainer.className = 'hud-sub-panel';

        const weaponsLabel = document.createElement('div');
        weaponsLabel.textContent = 'WEAPONS';
        weaponsLabel.className = 'hud-section-label';
        weaponsContainer.appendChild(weaponsLabel);

        // 4 slots in display order
        const slotConfig = [
            { arm: 'armLeft', type: 'grip', key: 'RMB', label: 'L-Grip', colorVar: '#ffff00', dimColorVar: '#555500' },
            { arm: 'armRight', type: 'grip', key: '1', label: 'R-Grip', colorVar: '#00ffff', dimColorVar: '#005555' },
            { arm: 'armLeft', type: 'shoulder', key: '2', label: 'L-Shldr', colorVar: '#ff8800', dimColorVar: '#552c00' },
            { arm: 'armRight', type: 'shoulder', key: '3', label: 'R-Shldr', colorVar: '#8800ff', dimColorVar: '#300060' },
        ];

        slotConfig.forEach(cfg => {
            const row = document.createElement('div');
            row.className = 'hud-weapon-row';

            const keyBadge = document.createElement('span');
            keyBadge.className = 'hud-key-badge';
            keyBadge.textContent = cfg.key;
            keyBadge.style.borderColor = cfg.colorVar;
            keyBadge.style.color = cfg.colorVar;

            const slotLabel = document.createElement('span');
            slotLabel.className = 'hud-weapon-slot-label';
            slotLabel.textContent = cfg.label;
            slotLabel.style.color = '#888';

            const weaponName = document.createElement('span');
            weaponName.className = 'hud-weapon-name';
            weaponName.textContent = '—';

            const cooldownBar = document.createElement('div');
            cooldownBar.className = 'hud-cooldown-bar';
            const cooldownFill = document.createElement('div');
            cooldownFill.className = 'hud-cooldown-fill';
            cooldownFill.style.background = cfg.colorVar;
            cooldownBar.appendChild(cooldownFill);

            const stateTag = document.createElement('span');
            stateTag.className = 'hud-state-tag';
            stateTag.style.display = 'none'; // Hidden for normal weapons

            row.appendChild(keyBadge);
            row.appendChild(slotLabel);
            row.appendChild(weaponName);
            row.appendChild(stateTag);
            row.appendChild(cooldownBar);
            weaponsContainer.appendChild(row);

            this.slotEls[`${cfg.arm}_${cfg.type}`] = {
                name: weaponName,
                stateTag,
                cooldownFill,
                keyBadge,
                slotLabel,
                ...cfg
            };
        });

        this.container.appendChild(weaponsContainer);

        // ── CREDITS & INTEL ──────────────────────────────────────────────────
        const intelContainer = document.createElement('div');
        intelContainer.className = 'hud-sub-panel';

        this.creditsDisplay = document.createElement('div');
        this.creditsDisplay.className = 'hud-credits';
        this.creditsDisplay.textContent = 'CR: 0';

        this.enemyCountDisplay = document.createElement('div');
        this.enemyCountDisplay.className = 'hud-intel-line';
        this.enemyCountDisplay.textContent = 'Hostiles: 0';

        this.terminalHealthDisplay = document.createElement('div');
        this.terminalHealthDisplay.className = 'hud-intel-line';
        this.terminalHealthDisplay.textContent = 'Terminal: 100%';

        intelContainer.appendChild(this.creditsDisplay);
        intelContainer.appendChild(this.enemyCountDisplay);
        intelContainer.appendChild(this.terminalHealthDisplay);
        this.container.appendChild(intelContainer);

        // ── CONTROLS HINT ────────────────────────────────────────────────────
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'hud-sub-panel hud-controls';

        const controlsLabel = document.createElement('div');
        controlsLabel.textContent = 'CONTROLS';
        controlsLabel.className = 'hud-section-label';
        controlsContainer.appendChild(controlsLabel);

        const controls = [
            ['WASD', 'Move'],
            ['Mouse', 'Aim'],
            ['RMB', 'L-Grip weapon'],
            ['1', 'R-Grip weapon'],
            ['2', 'L-Shoulder weapon'],
            ['3', 'R-Shoulder weapon'],
            ['LMB', 'Build tower (on socket)'],
            ['ESC', 'Pause'],
        ];

        controls.forEach(([key, desc]) => {
            const line = document.createElement('div');
            line.className = 'hud-control-line';
            line.innerHTML = `<span class="hud-key-inline">${key}</span><span class="hud-control-desc">${desc}</span>`;
            controlsContainer.appendChild(line);
        });

        this.container.appendChild(controlsContainer);

        // ── EVENT BUS ────────────────────────────────────────────────────────
        const bus = this.uiManager.game.eventBus;
        bus.on('mech:damage', (data) => this.updateHealth(data));
        bus.on('mech:heal', (data) => this.updateHealth(data));
        bus.on('credits:change', (amount) => this.updateCredits(amount));
        bus.on('terminal:damage', (data) => this.updateTerminal(data));
    }

    updateHealth(data) {
        if (!this.partBars || !data.parts) return;
        Object.keys(this.partBars).forEach(key => {
            if (data.parts[key]) {
                const part = data.parts[key];
                const pct = Math.max(0, (part.hp / part.maxHp) * 100);
                const bar = this.partBars[key];
                bar.fill.style.width = `${pct}%`;
                bar.fill.style.backgroundColor = pct > 50 ? '#0f0' : pct > 25 ? '#ff0' : '#f00';
                bar.text.textContent = `${Math.ceil(part.hp)}`;
            }
        });
    }

    updateCredits(amount) {
        if (this.creditsDisplay) this.creditsDisplay.textContent = `CR: ${amount}`;
    }

    updateTerminal(data) {
        if (this.terminalHealthDisplay) {
            const pct = Math.floor((data.hp / data.maxHp) * 100);
            this.terminalHealthDisplay.textContent = `Terminal: ${pct}%`;
            this.terminalHealthDisplay.style.color = pct > 50 ? '#fff' : '#f00';
        }
    }

    updateWeaponSlots(mech) {
        if (!mech || !mech.slots) return;

        const slotDefs = [
            { arm: 'armLeft', type: 'grip' },
            { arm: 'armRight', type: 'grip' },
            { arm: 'armLeft', type: 'shoulder' },
            { arm: 'armRight', type: 'shoulder' },
        ];

        slotDefs.forEach(({ arm, type }) => {
            const el = this.slotEls[`${arm}_${type}`];
            if (!el) return;

            const armAlive = mech.parts[arm].hp > 0;
            const slot = mech.slots[arm][type];

            // --- Arm destroyed ---
            if (!armAlive) {
                el.name.textContent = '✕ DESTROYED';
                el.name.style.color = '#f00';
                el.cooldownFill.style.width = '0%';
                el.cooldownFill.style.background = '#f00';
                el.keyBadge.style.opacity = '0.15';
                el.slotLabel.style.color = '#333';
                return;
            }

            // --- Empty slot ---
            if (!slot) {
                el.name.textContent = '— empty';
                el.name.style.color = '#444';
                el.cooldownFill.style.width = '0%';
                el.keyBadge.style.opacity = '0.2';  // Ghosted — no weapon to fire
                el.slotLabel.style.color = '#444';
                return;
            }

            el.slotLabel.style.color = '#888';

            // --- Shield slot: auto-cycle, no key needed ---
            if (slot.isShield) {
                el.keyBadge.style.opacity = '0';
                el.stateTag.style.display = 'inline';
                el.name.textContent = `⬡ ${slot.weaponData.Name}`;

                if (slot.shieldIsActive) {
                    // Shield is UP — defense bonus active
                    el.name.style.color = '#44ffcc';
                    el.stateTag.textContent = 'ACTIVE';
                    el.stateTag.style.color = '#44ffcc';
                    // Bar drains: full = just became active, empty = window about to expire
                    // Intuition: "this much active time remaining"
                    const activePct = CONFIG.SHIELD_ACTIVE_DURATION_MS > 0
                        ? Math.max(0, Math.min(100, (slot.shieldActiveMs / CONFIG.SHIELD_ACTIVE_DURATION_MS) * 100))
                        : 0;
                    el.cooldownFill.style.width = `${activePct}%`;
                    el.cooldownFill.style.background = '#44ffcc';
                } else {
                    // Shield is DOWN — recharging
                    el.name.style.color = '#446655';
                    el.stateTag.textContent = 'CHARGING';
                    el.stateTag.style.color = '#668866';
                    // Bar fills up: empty = just went on cooldown, full = about to come back
                    // Intuition: standard recharge fill — "wait for it to fill"
                    const rechargePct = slot.intervalMs > 0
                        ? Math.max(0, Math.min(100, ((slot.intervalMs - slot.shieldCooldownMs) / slot.intervalMs) * 100))
                        : 100;
                    el.cooldownFill.style.width = `${rechargePct}%`;
                    el.cooldownFill.style.background = '#224433';
                }
                return;
            }

            // --- Active weapon slot ---
            el.stateTag.style.display = 'none';
            el.keyBadge.style.opacity = '1';
            el.name.textContent = slot.weaponData.Name;
            el.name.style.color = '#fff';

            // Cooldown bar fills UP as weapon recharges:
            // 0% = just fired (on cooldown), 100% = ready to fire.
            // Color: dim while recharging, snaps to full bright when ready.
            const pct = slot.intervalMs > 0
                ? Math.max(0, Math.min(100, ((slot.intervalMs - slot.currentCooldownMs) / slot.intervalMs) * 100))
                : 100;
            const isReady = pct >= 100;
            el.cooldownFill.style.width = `${pct}%`;
            el.cooldownFill.style.background = isReady ? el.colorVar : el.dimColorVar;
        });
    }

    // Polling update — called every frame via UIManager
    update(dt) {
        const game = this.uiManager.game;

        if (game.entities) {
            this.enemyCountDisplay.textContent = `Hostiles: ${game.entities.enemies.length}`;
        }

        // Sync health on first frame
        if (game.mech && game.mech.parts && this.partBars && this.partBars.body.text.textContent === '--') {
            this.updateHealth({ parts: game.mech.parts });
        }

        if (game.credits !== undefined) {
            this.updateCredits(game.credits);
        }

        // Weapon slots (polled every frame for cooldown bars)
        if (game.mech) {
            this.updateWeaponSlots(game.mech);
        }
    }
}
