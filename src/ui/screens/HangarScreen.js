import { BaseScreen } from '../BaseScreen.js';
import { PlayerProfile } from '../../game/PlayerProfile.js';
import { HangarRenderer } from '../renderers/HangarRenderer.js';
import { MechStats } from '../../utils/MechStats.js';

export class HangarScreen extends BaseScreen {
    onMount(container) {
        // Overlay container styling (full screen)
        container.classList.add('screen-overlay', 'hangar-overlay');

        const wrapper = document.createElement('div');
        wrapper.classList.add('hangar-wrapper');

        // ==== LEFT PANE: VISUAL PREVIEW ====
        const visualPane = document.createElement('div');
        visualPane.classList.add('hangar-visual-pane');

        const canvasWrapper = document.createElement('div');
        canvasWrapper.classList.add('hangar-canvas-wrapper');

        const previewCanvas = document.createElement('canvas');
        previewCanvas.width = 300;
        previewCanvas.height = 300;
        previewCanvas.id = 'hangar-preview-canvas';

        canvasWrapper.appendChild(previewCanvas);
        visualPane.appendChild(canvasWrapper);

        // Core constraints overview
        const constraintsPanel = document.createElement('div');
        constraintsPanel.classList.add('hangar-constraints-panel');
        constraintsPanel.innerHTML = `
            <div class="constraint-row">Weight: <span id="hangar-weight">--</span> / <span id="hangar-power">--</span> Capacity</div>
            <div id="hangar-deploy-error" class="constraint-error"></div>
            <button id="hangar-deploy-btn" class="btn hangar-deploy-btn" disabled>Deploy Loadout</button>
            <button id="hangar-cancel-btn" class="btn hangar-cancel-btn">Cancel</button>
        `;
        visualPane.appendChild(constraintsPanel);


        // ==== RIGHT PANE: ENGINEERING PANEL ====
        const engineeringPane = document.createElement('div');
        engineeringPane.classList.add('hangar-engineering-pane');

        // Sub-pane: Current Loadout
        const currentLoadoutPanel = document.createElement('div');
        currentLoadoutPanel.style.display = 'flex';
        currentLoadoutPanel.style.gap = '15px';
        currentLoadoutPanel.style.flex = '1';
        currentLoadoutPanel.style.minHeight = '180px';
        currentLoadoutPanel.innerHTML = `
            <div class="hangar-list-panel" style="flex: 1;">
                <h3>Core Parts</h3>
                <ul id="hangar-parts-list" class="hangar-item-list"></ul>
            </div>
            <div class="hangar-list-panel" style="flex: 1;">
                <h3>Weapons</h3>
                <ul id="hangar-weapons-list" class="hangar-item-list"></ul>
            </div>
        `;

        // Sub-pane: All Owned Items (Stash)
        const stashPanel = document.createElement('div');
        stashPanel.classList.add('hangar-list-panel');
        stashPanel.innerHTML = `
            <h3>Inventory <span id="hangar-filter-label" style="color:#aaa; font-size: 12px;">(Select a slot)</span></h3>
            <ul id="hangar-stash-list" class="hangar-item-list"></ul>
        `;

        // Sub-pane: Real-Time Stats
        const statsPanel = document.createElement('div');
        statsPanel.classList.add('hangar-stats-panel');
        statsPanel.innerHTML = `
            <h3>Performance Projection</h3>
            <table class="hangar-stats-table">
                <thead>
                    <tr>
                        <th>Stat</th>
                        <th>Current</th>
                        <th>Projected</th>
                    </tr>
                </thead>
                <tbody id="hangar-stats-body">
                </tbody>
            </table>
        `;

        engineeringPane.appendChild(currentLoadoutPanel);
        engineeringPane.appendChild(stashPanel);
        engineeringPane.appendChild(statsPanel);


        // Combine into wrapper
        wrapper.appendChild(visualPane);
        wrapper.appendChild(engineeringPane);
        container.appendChild(wrapper);

        // Bind basic buttons early
        this.addListener(container.querySelector('#hangar-cancel-btn'), 'click', () => {
            this.uiManager.hideScreen();
        });

        this.addListener(container.querySelector('#hangar-deploy-btn'), 'click', () => {
            if (container.querySelector('#hangar-deploy-btn').disabled) return;

            // Apply working state to player profile
            PlayerProfile.loadout = JSON.parse(JSON.stringify(this.workingLoadout));
            PlayerProfile.inventory = JSON.parse(JSON.stringify(this.workingInventory));

            // Allow the engine to apply this to the current mech if needed
            if (this.uiManager.game.eventBus) {
                this.uiManager.game.eventBus.emit('hangar:deploy', PlayerProfile.loadout);
            }

            this.uiManager.hideScreen();
        });

        this.initWorkingState();
        this.renderLoadoutList();

        // Initialize the stats and constraints immediately on mount
        this.renderStats(this.workingLoadout);
    }

    initWorkingState() {
        // Deep clone the loadout
this.workingLoadout = JSON.parse(JSON.stringify(PlayerProfile.loadout));

        // Deep clone the inventory stash
        this.workingInventory = JSON.parse(JSON.stringify(PlayerProfile.inventory));

        // Active filter slot state
        this.activeSlotFilter = null;

        // Separate listener pools for loadout rows and stash rows — each cleared independently
        this.loadoutListeners = [];
        this.stashListeners = [];
    }

    addLoadoutListener(element, event, handler) {
        element.addEventListener(event, handler);
        this.loadoutListeners.push(() => element.removeEventListener(event, handler));
    }

    clearLoadoutListeners() {
        this.loadoutListeners.forEach(cleanup => cleanup());
        this.loadoutListeners = [];
    }

    addDynamicListener(element, event, handler) {
        element.addEventListener(event, handler);
        this.stashListeners.push(() => element.removeEventListener(event, handler));
    }

    clearDynamicListeners() {
        this.stashListeners.forEach(cleanup => cleanup());
        this.stashListeners = [];
    }

    renderLoadoutList() {
        this.clearLoadoutListeners();

        const partsListEl = this.container.querySelector('#hangar-parts-list');
        const weaponsListEl = this.container.querySelector('#hangar-weapons-list');
        if (!partsListEl || !weaponsListEl) return;

        partsListEl.innerHTML = '';
        weaponsListEl.innerHTML = '';

        const dataStore = this.uiManager.game.dataStore;

        // Helper to create list items
        const createRow = (label, partType, equipId, slotKey, emptyLabel = "EMPTY") => {
            const li = document.createElement('li');
            li.classList.add('hangar-item-row');
            if (this.activeSlotFilter === slotKey) li.classList.add('active-slot');

            let name = emptyLabel;
            if (equipId) {
                const isWpn = ['Grip', 'Shoulder'].includes(partType);
                const data = isWpn ? dataStore.getWeaponById(equipId) : dataStore.getPartById(partType, equipId);
                if (data) name = data.Name;
            }

            li.innerHTML = `
                <div style="color: #668; font-weight: bold;">${label}</div>
                <div style="color: ${equipId ? '#fff' : '#666'};">${name}</div>
                <div style="color: #4f4; text-align: right;"></div>
            `;

            this.addLoadoutListener(li, 'click', () => {
                this.activeSlotFilter = slotKey;
                this.renderLoadoutList(); // re-render to update active styling
                this.renderStashList();
            });

            return li;
        };

        const wl = this.workingLoadout;

        // Parts
        partsListEl.appendChild(createRow('Body', 'Body', wl.body?.id, 'body'));
        partsListEl.appendChild(createRow('Legs', 'Legs', wl.legs?.id, 'legs'));
        partsListEl.appendChild(createRow('Arm (L)', 'Arm', wl.armLeft?.id, 'armLeft'));
        partsListEl.appendChild(createRow('Arm (R)', 'Arm', wl.armRight?.id, 'armRight'));

        // Weapons
        weaponsListEl.appendChild(createRow('W1 (L)', 'Grip', wl.slots?.armLeft?.grip, 'armLeft.grip'));
        weaponsListEl.appendChild(createRow('W2 (L)', 'Shoulder', wl.slots?.armLeft?.shoulder, 'armLeft.shoulder'));
        weaponsListEl.appendChild(createRow('W1 (R)', 'Grip', wl.slots?.armRight?.grip, 'armRight.grip'));
        weaponsListEl.appendChild(createRow('W2 (R)', 'Shoulder', wl.slots?.armRight?.shoulder, 'armRight.shoulder'));
        // Complete render, update preview
        const canvas = this.container.querySelector('#hangar-preview-canvas');
        HangarRenderer.draw(canvas, wl, dataStore);
    }

    renderStashList() {
        this.clearDynamicListeners();

        const stashListEl = this.container.querySelector('#hangar-stash-list');
        const filterLabel = this.container.querySelector('#hangar-filter-label');
        if (!stashListEl || !filterLabel) return;
        stashListEl.innerHTML = ''; // clear

        if (!this.activeSlotFilter) {
            filterLabel.innerText = "(Select a slot)";
            return;
        }

        // Determine what type of item goes in this slot
        const slotTypeMap = {
            'body': { type: 'part', subtype: 'Body' },
            'legs': { type: 'part', subtype: 'Legs' },
            'armLeft': { type: 'part', subtype: 'Arm' },
            'armRight': { type: 'part', subtype: 'Arm' },
            'armLeft.grip': { type: 'weapon', subtype: 'Grip' },
            'armLeft.shoulder': { type: 'weapon', subtype: 'Shoulder' },
            'armRight.grip': { type: 'weapon', subtype: 'Grip' },
            'armRight.shoulder': { type: 'weapon', subtype: 'Shoulder' },
        };

        const filterRules = slotTypeMap[this.activeSlotFilter];
        filterLabel.innerText = `(${filterRules.subtype})`;

        const dataStore = this.uiManager.game.dataStore;

        // Collect matching items from working inventory
        let matchingItems = [];

        if (filterRules.type === 'part') {
            matchingItems = this.workingInventory.parts
                .map(id => ({ id, data: dataStore.getPartById(filterRules.subtype, id) }))
                .filter(item => item.data);
        } else if (filterRules.type === 'weapon') {
            const categoryIds = new Set((dataStore.weapons[filterRules.subtype] || []).map(w => w.ID));
            matchingItems = this.workingInventory.weapons
                .map(id => ({ id, data: dataStore.getWeaponById(id) }))
                .filter(item => item.data && categoryIds.has(item.id));
        }

        // --- Render "Unequip" option for weapons ---
        let currentEquippedId = null;
        if (filterRules.type === 'weapon') {
            // Check if there is currently a weapon in this slot
            const keys = this.activeSlotFilter.split('.'); // e.g., ["armLeft", "grip"]
            currentEquippedId = this.workingLoadout.slots[keys[0]]?.[keys[1]];

            if (currentEquippedId) {
                const unequipLi = document.createElement('li');
                unequipLi.classList.add('hangar-item-row');
                unequipLi.innerHTML = `
                    <div style="color: #668; font-weight: bold; grid-column: 1 / -1;">[ UNEQUIP WEAPON ]</div>
                `;
                this.addDynamicListener(unequipLi, 'click', () => {
                    this.equipItem(null, filterRules.type, keys);
                });
                stashListEl.appendChild(unequipLi);
            }
        }

        if (matchingItems.length === 0 && !currentEquippedId) {
            const li = document.createElement('li');
            li.style.padding = '10px';
            li.style.color = '#666';
            li.innerText = 'No items available for this slot.';
            stashListEl.appendChild(li);
        }

        // Render sorted valid items
        matchingItems.sort((a, b) => a.data.Name.localeCompare(b.data.Name));
        matchingItems.forEach(item => {
            const li = document.createElement('li');
            li.classList.add('hangar-item-row');
            li.innerHTML = `
                <div style="color: #668; font-weight: bold;">></div>
                <div style="color: #fff;">${item.data.Name}</div>
                <div style="color: #888; font-size: 10px; text-align: right;"></div>
            `;

            this.addDynamicListener(li, 'mouseenter', () => {
                const keys = this.activeSlotFilter.split('.');
                // Determine potential loadout
                const potential = JSON.parse(JSON.stringify(this.workingLoadout));
                if (filterRules.type === 'part') {
                    if (!potential[keys[0]]) potential[keys[0]] = {};
                    potential[keys[0]].id = item.id;
                } else {
                    potential.slots[keys[0]][keys[1]] = item.id;
                }
                this.renderStats(potential, true);
            });
            this.addDynamicListener(li, 'mouseleave', () => {
                this.renderStats(this.workingLoadout);
            });

            // Click logic placeholder (swap)
            this.addDynamicListener(li, 'click', () => {
                const keys = this.activeSlotFilter.split('.');
                this.equipItem(item.id, filterRules.type, keys);
            });

            stashListEl.appendChild(li);
        });

        // Render stats initially when opening the stash filter
        this.renderStats(this.workingLoadout);
    }

    renderStats(loadoutToRender, isHoverPreview = false) {
        const bodyEl = this.container.querySelector('#hangar-stats-body');
        const weightEl = this.container.querySelector('#hangar-weight');
        const powerEl = this.container.querySelector('#hangar-power');

        if (!bodyEl) return;
        bodyEl.innerHTML = '';

        const dataStore = this.uiManager.game.dataStore;
        const currentStats = MechStats.deriveStats(this.workingLoadout, dataStore);
        const projectedStats = loadoutToRender ? MechStats.deriveStats(loadoutToRender, dataStore) : currentStats;

        if (!currentStats || !projectedStats) return;

        // Update top restraints
        weightEl.innerText = projectedStats.totalWeight;
        powerEl.innerText = projectedStats.totalPowerOutput;
        if (projectedStats.totalWeight > projectedStats.totalPowerOutput) {
            weightEl.style.color = '#f44';
        } else {
            weightEl.style.color = '#aad';
        }

        const statsToCompare = [
            { label: 'Weight', cur: currentStats.totalWeight, proj: projectedStats.totalWeight, lowerIsBetter: true },
            { label: 'Power Cap', cur: currentStats.totalPowerOutput, proj: projectedStats.totalPowerOutput, lowerIsBetter: false },
            { label: 'Speed', cur: currentStats.actualSpeed, proj: projectedStats.actualSpeed, lowerIsBetter: false },
            { label: 'Move Eff.', cur: MechStats.toPercent(currentStats.moveEfficiency), proj: MechStats.toPercent(projectedStats.moveEfficiency), lowerIsBetter: false },
            { label: 'Evasion', cur: MechStats.toPercent(currentStats.evasion), proj: MechStats.toPercent(projectedStats.evasion), lowerIsBetter: false },
            { label: 'Max HP', cur: currentStats.maxHp, proj: projectedStats.maxHp, lowerIsBetter: false }
        ];

        statsToCompare.forEach(stat => {
            const tr = document.createElement('tr');

            let projClass = '';
            if (stat.cur !== stat.proj) {
                if ((stat.proj > stat.cur && !stat.lowerIsBetter) || (stat.proj < stat.cur && stat.lowerIsBetter)) {
                    projClass = 'stat-positive';
                } else {
                    projClass = 'stat-negative';
                }
            }

            tr.innerHTML = `
                <td>${stat.label}</td>
                <td>${stat.cur}</td>
                <td class="${projClass}">${stat.proj}</td>
            `;
            bodyEl.appendChild(tr);
        });

        this.validateDeploymentConstraints(projectedStats, isHoverPreview);
    }

    validateDeploymentConstraints(stats, isHoverPreview = false) {
        let isValid = true;
        const msgLines = [];

        // 1. All core parts equipped (always checked against committed working loadout)
        const wl = this.workingLoadout;
        if (!wl.body?.id || !wl.legs?.id || !wl.armLeft?.id || !wl.armRight?.id) {
            isValid = false;
            msgLines.push("ERROR: Missing core part(s).");
        }

        // 2. Weight vs Power (may reflect a hover projection)
        if (stats.totalWeight > stats.totalPowerOutput) {
            isValid = false;
            const prefix = isHoverPreview ? '[PROJECTED] ' : 'ERROR: ';
            msgLines.push(`${prefix}Weight would exceed Power Capacity.`);
        }

        // 3. At least 1 weapon (always checked against committed working loadout)
        const slots = wl.slots || {};
        const hasWeapon = !!(slots.armLeft?.grip || slots.armLeft?.shoulder || slots.armRight?.grip || slots.armRight?.shoulder);
        if (!hasWeapon) {
            isValid = false;
            msgLines.push("ERROR: Must equip at least 1 weapon.");
        }

        const btn = this.container.querySelector('#hangar-deploy-btn');
        const errEl = this.container.querySelector('#hangar-deploy-error');

        if (btn) btn.disabled = !isValid;
        if (errEl) errEl.innerHTML = msgLines.join('<br>');
    }

    equipItem(id, itemType, keys) {
        // Find current equipped item to swap OUT
        let currentId = null;
        if (itemType === 'part') {
            currentId = this.workingLoadout[keys[0]]?.id;
        } else {
            currentId = this.workingLoadout.slots[keys[0]]?.[keys[1]];
        }

        // Add to inventory if there was one
        if (currentId) {
            if (itemType === 'part') {
                this.workingInventory.parts.push(currentId);
            } else {
                this.workingInventory.weapons.push(currentId);
            }
        }

        // Remove new item from inventory if id is provided (not unequip)
        if (id) {
            if (itemType === 'part') {
                const idx = this.workingInventory.parts.indexOf(id);
                if (idx > -1) this.workingInventory.parts.splice(idx, 1);
                this.workingLoadout[keys[0]].id = id;
            } else {
                const idx = this.workingInventory.weapons.indexOf(id);
                if (idx > -1) this.workingInventory.weapons.splice(idx, 1);
                // Ensure slots struct exists
                if (!this.workingLoadout.slots[keys[0]]) this.workingLoadout.slots[keys[0]] = {};
                this.workingLoadout.slots[keys[0]][keys[1]] = id;
            }
        } else {
            // Unequip case
            if (itemType === 'weapon') {
                this.workingLoadout.slots[keys[0]][keys[1]] = null;
            }
        }

        // Re-render
        this.renderLoadoutList();
        this.renderStashList(); // This also triggers renderStats
    }
}
