export class GameLoop {
    constructor(updateFn, drawFn) {
        this.updateFn = updateFn;
        this.drawFn = drawFn;
        this.lastTime = 0;
        this.running = false;
        this.rafId = null;
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.lastTime = performance.now();
        this.rafId = requestAnimationFrame((ts) => this.loop(ts));
    }

    stop() {
        this.running = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    loop(timestamp) {
        if (!this.running) return;

        let dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        // Clamp dt to prevent "spiral of death" or huge jumps
        if (dt > 0.1) dt = 0.1;

        this.updateFn(dt);
        this.drawFn();

        this.rafId = requestAnimationFrame((ts) => this.loop(ts));
    }
}
