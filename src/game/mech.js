import { CONFIG } from './Config.js';
import { Collision } from '../engine/Collision.js';
import { CombatSystem } from '../engine/CombatSystem.js';
import { Projectile } from './projectile.js';

/**
 * Mech — the player-controlled unit.
 *
 * Weapon slots:
 *   armLeft.grip     → Right Mouse Button
 *   armRight.grip    → Key 1
 *   armLeft.shoulder → Key 2
 *   armRight.shoulder→ Key 3
 *
 * Stats are derived from parts.json / weapons.json via DataStore.
 */
export class Mech {
    constructor(x, y, eventBus, dataStore) {
        this.x = x;
        this.y = y;
        this.eventBus = eventBus;
        this.size = 40;
        this.color = '#00ff00';

        // Faction / damageable interface
        this.faction = CONFIG.FACTION.PLAYER;
        this.damageFlashTimer = 0;
        this.destructionSparks = [];

        // --- Load parts from data ---
        const loadout = CONFIG.STARTING_LOADOUT;
        const bodyData = dataStore.getPartById('Body', loadout.body.id);
        const armLData = dataStore.getPartById('Arm', loadout.armLeft.id);
        const armRData = dataStore.getPartById('Arm', loadout.armRight.id);
        const legsData = dataStore.getPartById('Legs', loadout.legs.id);

        this.parts = {
            body: { name: bodyData.Name, hp: bodyData.HP, maxHp: bodyData.HP, defense: bodyData.Defense },
            armLeft: { name: armLData.Name, hp: armLData.HP, maxHp: armLData.HP, defense: armLData.Defense, accuracyRatio: armLData.AccuracyRatio },
            armRight: { name: armRData.Name, hp: armRData.HP, maxHp: armRData.HP, defense: armRData.Defense, accuracyRatio: armRData.AccuracyRatio },
            legs: { name: legsData.Name, hp: legsData.HP, maxHp: legsData.HP, defense: legsData.Defense }
        };

        // --- Load weapon slots from data ---
        const slotCfg = loadout.slots;
        this.slots = {
            armLeft: {
                grip: this._initSlot(dataStore, armLData, slotCfg.armLeft.grip),
                shoulder: this._initSlot(dataStore, armLData, slotCfg.armLeft.shoulder)
            },
            armRight: {
                grip: this._initSlot(dataStore, armRData, slotCfg.armRight.grip),
                shoulder: this._initSlot(dataStore, armRData, slotCfg.armRight.shoulder)
            }
        };

        // --- Derived combat / movement stats ---
        const allWeaponWeights = this._sumWeaponWeights();
        this.totalWeight = (bodyData.Weight || 0) + (armLData.Weight || 0) + (armRData.Weight || 0) + (legsData.Weight || 0) + allWeaponWeights;
        this.totalPowerOutput = (bodyData.PowerOutput || 0) + (legsData.PowerOutput || 0);

        const moveEfficiency = CombatSystem.calcMoveEfficiency(this.totalWeight, this.totalPowerOutput);
        const additiveMods = (legsData.MovementSpeedMod || 0);
        this.speed = CombatSystem.calcActualSpeed(CONFIG.MECH_BASE_SPEED, additiveMods, moveEfficiency);

        this.evasion = CombatSystem.calcEvasion(this.totalWeight, this.totalPowerOutput);

        this.angle = 0; // Facing angle in radians
    }

    /**
     * Create a slot object from weapon ID (or null for empty slot).
     * @param {object} dataStore
     * @param {object} armData - The arm part data this slot belongs to
     * @param {number|null} weaponId
     * @returns {object|null}
     */
    _initSlot(dataStore, armData, weaponId) {
        if (!weaponId) return null;
        const weaponData = dataStore.getWeaponById(weaponId);
        if (!weaponData) {
            console.warn(`[Mech] Weapon ID ${weaponId} not found in DataStore.`);
            return null;
        }
        const intervalMs = CombatSystem.calcAttackInterval(
            weaponData.TypeAttackInterval,
            weaponData.LocalAttackSpeedMod || 0,
            []
        );
        const combinedAccuracy = CombatSystem.combineAccuracy(
            weaponData.AccuracyRatio || 10000,
            armData.AccuracyRatio || 10000
        );

        const isShield = weaponData.Type === 'Shield';
        // isBurst: fires rounds sequentially with IntraBurstInterval between them.
        // Driven by SequentialFire flag — independent of DeliveryType (which is spatial only).
        const isBurst = !isShield
            && (weaponData.ProjectilesPerRound || 1) > 1
            && weaponData.SequentialFire === 1;

        const slot = {
            weaponData,
            intervalMs,
            combinedAccuracy,
            isShield,
            isBurst,
            currentCooldownMs: 0,
            // Burst state (only used when isBurst)
            burstRemaining: 0,   // rounds still queued
            burstTimerMs: 0,   // countdown until next burst round
            burstAngle: 0,   // direction locked at trigger
            burstArm: null // arm key locked at trigger
        };

        if (isShield) {
            // Shields run an automatic active→cooldown→active cycle. No player input.
            // TODO: SHIELD_ACTIVE_DURATION_MS should eventually come from weapon data.
            slot.shieldActiveMs = CONFIG.SHIELD_ACTIVE_DURATION_MS;
            slot.shieldCooldownMs = 0;
            slot.shieldIsActive = true;
        }

        return slot;
    }

    _sumWeaponWeights() {
        let total = 0;
        for (const arm of ['armLeft', 'armRight']) {
            for (const type of ['grip', 'shoulder']) {
                const slot = this.slots?.[arm]?.[type];
                if (slot) total += slot.weaponData.Weight || 0;
            }
        }
        return total;
    }

    /** Check whether a given slot is usable (arm alive + weapon equipped). */
    _slotUsable(armKey, slotType) {
        if (this.parts[armKey].hp <= 0) return false;
        return this.slots[armKey][slotType] !== null;
    }

    /**
     * Compute the barrel world position for a given arm.
     * @param {'armLeft'|'armRight'} armKey
     * @returns {{ x: number, y: number }}
     */
    _barrelPosition(armKey) {
        const side = armKey === 'armLeft' ? -1 : 1;
        const mountOffsetX = side * this.size / 2;
        const mountOffsetY = -this.size / 2;

        const c = Math.cos(this.angle + Math.PI / 2);
        const s = Math.sin(this.angle + Math.PI / 2);

        return {
            x: this.x + (mountOffsetX * c - mountOffsetY * s),
            y: this.y + (mountOffsetX * s + mountOffsetY * c)
        };
    }

    /**
     * Spawn a single projectile from a slot toward a given angle.
     * Used by both fireSlot (round 1) and the burst tick (rounds 2-N).
     */
    _spawnProjectile(armKey, slot, angle) {
        const barrel = this._barrelPosition(armKey);
        const wd = slot.weaponData;
        const rangePixels = wd.RangeMax * CONFIG.TILE_SIZE;
        const p = new Projectile(
            barrel.x, barrel.y,
            angle,
            400,
            rangePixels,
            this.faction,
            wd.Attack,
            slot.combinedAccuracy
        );
        p.color = '#ffff00';
        return p;
    }

    /**
     * Attempt to fire a specific slot toward a target position.
     * For single-projectile and Fan weapons: spawns all projectiles immediately.
     * For Linear multi-projectile (burst) weapons: spawns round 1 and arms the burst queue.
     * Per BasicConcepts.md: FinalAttackInterval starts at round 1.
     *
     * @param {'armLeft'|'armRight'} armKey
     * @param {'grip'|'shoulder'} slotType
     * @param {{ x: number, y: number }} target - World position of mouse
     * @returns {Projectile[]}
     */
    fireSlot(armKey, slotType, target) {
        if (!this._slotUsable(armKey, slotType)) return [];

        const slot = this.slots[armKey][slotType];
        if (slot.currentCooldownMs > 0) return [];
        if (slot.isShield) return [];

        const weaponData = slot.weaponData;

        if (weaponData.DeliveryType === 'Swing') return []; // Deferred

        const barrel = this._barrelPosition(armKey);
        const dx = target.x - barrel.x;
        const dy = target.y - barrel.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const rangeMinPixels = (weaponData.RangeMin || 1) * CONFIG.TILE_SIZE;
        if (dist < rangeMinPixels) return []; // Inside dead zone (e.g. missiles)

        const baseAngle = Math.atan2(dy, dx);
        const count = Math.max(1, weaponData.ProjectilesPerRound || 1);

        // --- Start cooldown at round 1 (per spec) ---
        slot.currentCooldownMs = slot.intervalMs;

        // --- Fan weapons: all projectiles at once, spread over cone ---
        if (weaponData.DeliveryType === 'Fan' && count > 1) {
            const spreadRad = (CONFIG.FAN_SPREAD_DEGREES * Math.PI / 180);
            const step = spreadRad / (count - 1);
            const projectiles = [];
            for (let i = 0; i < count; i++) {
                const angle = baseAngle - spreadRad / 2 + step * i;
                projectiles.push(this._spawnProjectile(armKey, slot, angle));
            }
            return projectiles;
        }

        // --- Linear burst: fire round 1 now, queue the rest ---
        if (count > 1) {
            // Arm burst queue with remaining rounds
            slot.burstRemaining = count - 1;
            slot.burstTimerMs = CONFIG.INTRA_BURST_INTERVAL_MS;
            slot.burstAngle = baseAngle;
            slot.burstArm = armKey;
        }

        // Fire round 1 immediately
        return [this._spawnProjectile(armKey, slot, baseAngle)];
    }

    update(dt, inputVector, mousePos, inputState, game) {
        const dtMs = dt * 1000;

        // Damage Flash
        if (this.damageFlashTimer > 0) this.damageFlashTimer -= dt;

        // Destruction spark decay
        for (let i = this.destructionSparks.length - 1; i >= 0; i--) {
            this.destructionSparks[i].timer -= dt;
            if (this.destructionSparks[i].timer <= 0) this.destructionSparks.splice(i, 1);
        }

        // Cooldown tick for all slots; shield cycle management
        for (const arm of ['armLeft', 'armRight']) {
            for (const type of ['grip', 'shoulder']) {
                const slot = this.slots[arm][type];
                if (!slot) continue;

                if (slot.isShield) {
                    // Shield runs its own automatic cycle independent of player input
                    if (slot.shieldIsActive) {
                        slot.shieldActiveMs = Math.max(0, slot.shieldActiveMs - dtMs);
                        if (slot.shieldActiveMs <= 0) {
                            // Active window expired → enter cooldown
                            slot.shieldIsActive = false;
                            slot.shieldCooldownMs = slot.intervalMs;
                        }
                    } else {
                        slot.shieldCooldownMs = Math.max(0, slot.shieldCooldownMs - dtMs);
                        if (slot.shieldCooldownMs <= 0) {
                            // Cooldown expired → become active again
                            slot.shieldIsActive = true;
                            slot.shieldActiveMs = CONFIG.SHIELD_ACTIVE_DURATION_MS;
                        }
                    }
                } else {
                    if (slot.currentCooldownMs > 0) {
                        slot.currentCooldownMs = Math.max(0, slot.currentCooldownMs - dtMs);
                    }
                }
            }
        }

        // Compute total active shield defense bonus for this frame
        // Applied to ALL incoming hits against the mech while at least one shield is active.
        let shieldBonus = 0;
        for (const arm of ['armLeft', 'armRight']) {
            for (const type of ['grip', 'shoulder']) {
                const slot = this.slots[arm][type];
                if (slot && slot.isShield && slot.shieldIsActive && this.parts[arm].hp > 0) {
                    shieldBonus += (slot.weaponData.Defense || 0);
                }
            }
        }
        this.activeShieldDefenseBonus = shieldBonus;

        // Movement
        if (inputVector.x !== 0 || inputVector.y !== 0) {
            let currentSpeed = this.speed;
            if (this.parts.legs.hp <= 0) {
                currentSpeed = Math.floor(currentSpeed * 5000 / 10000);
            }

            let dx = inputVector.x * currentSpeed * dt;
            let dy = inputVector.y * currentSpeed * dt;

            // X-axis slide
            let nextX = this.x + dx;
            if (this.checkCollision(nextX, this.y, game)) dx = 0;
            this.x += dx;

            // Y-axis slide
            let nextY = this.y + dy;
            if (this.checkCollision(this.x, nextY, game)) dy = 0;
            this.y += dy;
        }

        // Face mouse
        if (mousePos) {
            this.angle = Math.atan2(mousePos.y - this.y, mousePos.x - this.x);
        }

        // Weapon firing — return all new projectiles as an array
        const newProjectiles = [];

        // --- Burst tick: emit queued rounds for in-progress bursts ---
        for (const arm of ['armLeft', 'armRight']) {
            for (const type of ['grip', 'shoulder']) {
                const slot = this.slots[arm][type];
                if (!slot || !slot.isBurst || slot.burstRemaining <= 0) continue;
                if (this.parts[arm].hp <= 0) { slot.burstRemaining = 0; continue; } // Arm lost mid-burst

                slot.burstTimerMs -= dtMs;
                if (slot.burstTimerMs <= 0) {
                    newProjectiles.push(this._spawnProjectile(arm, slot, slot.burstAngle));
                    slot.burstRemaining--;
                    slot.burstTimerMs = slot.burstRemaining > 0 ? CONFIG.INTRA_BURST_INTERVAL_MS : 0;
                }
            }
        }

        // --- Player input fire ---
        if (inputState && mousePos) {
            if (inputState.isRightDown) {
                newProjectiles.push(...this.fireSlot('armLeft', 'grip', mousePos));
            }
            if (inputState.key1) {
                newProjectiles.push(...this.fireSlot('armRight', 'grip', mousePos));
            }
            if (inputState.key2) {
                newProjectiles.push(...this.fireSlot('armLeft', 'shoulder', mousePos));
            }
            if (inputState.key3) {
                newProjectiles.push(...this.fireSlot('armRight', 'shoulder', mousePos));
            }
        }

        return newProjectiles;

    }

    checkCollision(x, y, game) {
        const map = game.map;
        const entities = game.entities;
        const radius = (this.size / 2) * 0.8;

        const queryRect = { x: x - radius, y: y - radius, width: radius * 2, height: radius * 2 };
        const obstacles = map.getObstacles(queryRect);
        const myCircle = { x, y, radius };

        for (const obs of obstacles) {
            if (Collision.checkCircleRect(myCircle, obs)) return true;
        }

        if (entities) {
            for (const enemy of entities.enemies) {
                if (enemy.hp > 0 && Collision.checkCircleCircle(myCircle, { x: enemy.x, y: enemy.y, radius: enemy.size / 2 })) {
                    return true;
                }
            }
        }

        const term = game.terminal;
        if (term && term.hp > 0) {
            const termRect = { x: term.x - term.width / 2, y: term.y - term.height / 2, width: term.width, height: term.height };
            if (Collision.checkCircleRect(myCircle, termRect)) return true;
        }

        return false;
    }

    /**
     * Called when a projectile hits the Mech. Applies damage to specified part.
     * partKey comes from CombatSystem.resolveHit.
     */
    applyPartDamage(partKey, damage) {
        const part = this.parts[partKey];
        const wasAlive = part.hp > 0;
        part.hp = Math.max(0, part.hp - damage);

        // Trigger destruction sparks
        if (wasAlive && part.hp === 0 && partKey !== 'body') {
            let offsetX = 0, offsetY = 0;
            if (partKey === 'armLeft') { offsetX = -this.size / 2 - 5; }
            if (partKey === 'armRight') { offsetX = this.size / 2 - 5; }
            if (partKey === 'legs') { offsetY = this.size / 4; }
            this.destructionSparks.push({ x: offsetX, y: offsetY, timer: 0.5, maxTimer: 0.5 });
        }

        this.damageFlashTimer = 0.1;

        if (this.eventBus) {
            this.eventBus.emit('mech:damage', {
                hp: this.parts.body.hp,
                maxHp: this.parts.body.maxHp,
                parts: this.parts
            });
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + Math.PI / 2);

        // --- Draw all equipped weapon range rings ---
        const SLOT_COLORS = CONFIG.SLOT_COLORS;
        const slotDefs = [
            { arm: 'armLeft', type: 'grip', colorKey: 'armLeft_grip', sideX: -1 },
            { arm: 'armRight', type: 'grip', colorKey: 'armRight_grip', sideX: 1 },
            { arm: 'armLeft', type: 'shoulder', colorKey: 'armLeft_shoulder', sideX: -1 },
            { arm: 'armRight', type: 'shoulder', colorKey: 'armRight_shoulder', sideX: 1 },
        ];

        for (const def of slotDefs) {
            if (!this._slotUsable(def.arm, def.type)) continue;
            const slot = this.slots[def.arm][def.type];
            if (slot.isShield) continue; // Shields have no range ring

            const wd = slot.weaponData;
            const maxPx = wd.RangeMax * CONFIG.TILE_SIZE;
            const minPx = (wd.RangeMin || 1) * CONFIG.TILE_SIZE;
            const cx = def.sideX * this.size / 2;
            const cy = -this.size / 2;
            const color = SLOT_COLORS[def.colorKey];

            // Max range ring (solid)
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.arc(cx, cy, maxPx, 0, Math.PI * 2);
            ctx.stroke();

            // Min range ring (dashed) — only draw if meaningfully different from max
            if (wd.RangeMin > 1) {
                ctx.strokeStyle = color;
                ctx.lineWidth = 1;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.arc(cx, cy, minPx, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }

        // --- Shield active glow ---
        // Drawn before legs so it sits behind the whole mech body.
        // Two-layer approach: large shadowBlur for outer halo + filled rect for inner tint.
        let shieldGlowAlpha = 0;
        if (this.activeShieldDefenseBonus > 0) {
            let maxActiveRatio = 0;
            for (const arm of ['armLeft', 'armRight']) {
                for (const type of ['grip', 'shoulder']) {
                    const slot = this.slots[arm][type];
                    if (slot && slot.isShield && slot.shieldIsActive && this.parts[arm].hp > 0) {
                        const ratio = slot.shieldActiveMs / CONFIG.SHIELD_ACTIVE_DURATION_MS;
                        if (ratio > maxActiveRatio) maxActiveRatio = ratio;
                    }
                }
            }
            shieldGlowAlpha = 0.55 + maxActiveRatio * 0.45; // Range: 0.55 (about to expire) → 1.0 (fresh)

            const pad = 8; // How many px larger than the mech body the glow rect is
            const gx = -(this.size / 2 + pad);
            const gy = -(this.size / 2 + pad);
            const gs = this.size + pad * 2;

            // Outer halo via shadowBlur
            ctx.shadowColor = `rgba(68, 255, 204, ${shieldGlowAlpha})`;
            ctx.shadowBlur = 40;
            // Inner tint — semi-transparent cyan fill on the enlarged rect
            ctx.fillStyle = `rgba(68, 255, 204, ${shieldGlowAlpha * 0.25})`;
            ctx.fillRect(gx, gy, gs, gs);
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
        }

        // --- Draw Legs (base) ---
        const legsAlive = this.parts.legs.hp > 0;
        if (legsAlive) {
            ctx.fillStyle = '#2d7a2d';
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        } else {
            // Destroyed: same grey stub treatment as arms
            ctx.fillStyle = '#555555';
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        }

        // --- Draw Torso (no shadowBlur here — glow is handled above) ---
        if (this.damageFlashTimer > 0) {
            ctx.fillStyle = '#ffffff';
        } else {
            ctx.fillStyle = this.color;
        }
        ctx.fillRect(-this.size / 3, -this.size / 3, this.size / 1.5, this.size / 1.5);

        // --- Draw Left Arm ---
        if (this.parts.armLeft.hp > 0) {
            ctx.fillStyle = '#00aa00';
            ctx.fillRect(-this.size / 2 - 5, -5, 10, 10);

            // Draw Grip weapon barrel
            const lgSlot = this.slots.armLeft.grip;
            if (lgSlot && lgSlot.weaponData.ProjectilesPerRound > 0) {
                ctx.fillStyle = '#ffff00';
                ctx.fillRect(-this.size / 2 - 2, -this.size / 2, 4, 15);
            }
            // Draw Shoulder weapon — sits at the rear of the arm (positive Y = behind mech facing)
            // Positioned so the arm is still partially visible in front of it
            const lsSlot = this.slots.armLeft.shoulder;
            if (lsSlot) {
                ctx.fillStyle = '#ff8800';
                ctx.fillRect(-this.size / 2 - 5, 0, 10, 10);
            }
        } else {
            ctx.fillStyle = '#555555';
            ctx.fillRect(-this.size / 2 - 2, -3, 4, 6);
        }

        // --- Draw Right Arm ---
        if (this.parts.armRight.hp > 0) {
            ctx.fillStyle = '#00aa00';
            ctx.fillRect(this.size / 2 - 5, -5, 10, 10);

            const rgSlot = this.slots.armRight.grip;
            if (rgSlot && rgSlot.weaponData.ProjectilesPerRound > 0) {
                ctx.fillStyle = '#00ffff';
                ctx.fillRect(this.size / 2 - 2, -this.size / 2, 4, 15);
            }
            // Draw Shoulder weapon — sits at the rear of the arm (positive Y = behind mech facing)
            const rsSlot = this.slots.armRight.shoulder;
            if (rsSlot) {
                ctx.fillStyle = '#8800ff';
                ctx.fillRect(this.size / 2 - 5, 0, 10, 10);
            }
        } else {
            ctx.fillStyle = '#555555';
            ctx.fillRect(this.size / 2 - 2, -3, 4, 6);
        }

        // --- Destruction Sparks ---
        for (const spark of this.destructionSparks) {
            const progress = 1.0 - (spark.timer / spark.maxTimer);
            const r = 5 + progress * 40;
            const alpha = spark.timer / spark.maxTimer;
            ctx.fillStyle = `rgba(255, 50, 0, ${alpha * 0.8})`;
            ctx.beginPath();
            ctx.arc(spark.x, spark.y, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(spark.x, spark.y, r * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}
