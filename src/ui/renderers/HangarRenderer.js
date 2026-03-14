/**
 * Renders the mech in a front-facing orthographic view for the Hangar UI.
 * Distinct from the top-down rendering in Combat/Map scenes.
 */
export const HangarRenderer = {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {object} workingLoadout
     * @param {object} dataStore
     */
    draw(canvas, workingLoadout, dataStore) {
        if (!canvas || !workingLoadout) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;

        ctx.clearRect(0, 0, w, h);

        const cx = w / 2;
        const cy = h / 2;

        ctx.save();
        ctx.translate(cx, cy);

        // Simple stand-in front-facing shapes.
        // We evaluate what's equipped and draw it.
        const bodyAlive = !!workingLoadout.body?.id;
        const legsAlive = !!workingLoadout.legs?.id;
        const armLAlive = !!workingLoadout.armLeft?.id;
        const armRAlive = !!workingLoadout.armRight?.id;

        const slots = workingLoadout.slots || {};
        const lGripWpn = slots.armLeft?.grip;
        const lShoulderWpn = slots.armLeft?.shoulder;
        const rGripWpn = slots.armRight?.grip;
        const rShoulderWpn = slots.armRight?.shoulder;

        const SCALE = 2; // scale up for the UI preview

        // 1. BACK layer (Shoulder Weapons)
        if (bodyAlive) {
            // L Shoulder
            if (lShoulderWpn) {
                ctx.fillStyle = '#ff8800'; // Orange
                ctx.fillRect(-25 * SCALE, -20 * SCALE, 15 * SCALE, 25 * SCALE);
            }
            // R Shoulder
            if (rShoulderWpn) {
                ctx.fillStyle = '#8800ff'; // Purple
                ctx.fillRect(10 * SCALE, -20 * SCALE, 15 * SCALE, 25 * SCALE);
            }
        }

        // 2. LEGS
        if (legsAlive) {
            ctx.fillStyle = '#2d7a2d';
            // Left leg
            ctx.fillRect(-12 * SCALE, 10 * SCALE, 10 * SCALE, 20 * SCALE);
            // Right leg
            ctx.fillRect(2 * SCALE, 10 * SCALE, 10 * SCALE, 20 * SCALE);
            // Pelvis
            ctx.fillRect(-15 * SCALE, 0, 30 * SCALE, 12 * SCALE);
        }

        // 3. ARMS
        if (armLAlive) {
            ctx.fillStyle = '#00aa00';
            ctx.fillRect(-30 * SCALE, -5 * SCALE, 15 * SCALE, 25 * SCALE);
            // Grip Wpn L
            if (lGripWpn) {
                ctx.fillStyle = '#ffff00'; // yellow
                ctx.fillRect(-28 * SCALE, 15 * SCALE, 8 * SCALE, 30 * SCALE);
            }
        }

        if (armRAlive) {
            ctx.fillStyle = '#00aa00';
            ctx.fillRect(15 * SCALE, -5 * SCALE, 15 * SCALE, 25 * SCALE);
            // Grip Wpn R
            if (rGripWpn) {
                ctx.fillStyle = '#00ffff'; // cyan
                ctx.fillRect(20 * SCALE, 15 * SCALE, 8 * SCALE, 30 * SCALE);
            }
        }

        // 4. BODY
        if (bodyAlive) {
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(-18 * SCALE, -15 * SCALE, 36 * SCALE, 25 * SCALE);

            // "Eye" visor
            ctx.fillStyle = '#0ff';
            ctx.fillRect(-8 * SCALE, -10 * SCALE, 16 * SCALE, 4 * SCALE);
        }

        ctx.restore();
    }
};
