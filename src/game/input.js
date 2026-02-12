export class InputHandler {
    constructor(canvas) {
        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false
        };

        // Mouse State
        this.mouse = { x: 0, y: 0, isDown: false };
        this.canvas = canvas;

        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));

        // Mouse Listeners
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('mousedown', (e) => this.onMouseDown(e));
        window.addEventListener('mouseup', (e) => this.onMouseUp(e));
    }

    onKeyDown(e) {
        const key = e.key.toLowerCase();
        if (this.keys.hasOwnProperty(key)) {
            this.keys[key] = true;
        }
    }

    onKeyUp(e) {
        const key = e.key.toLowerCase();
        if (this.keys.hasOwnProperty(key)) {
            this.keys[key] = false;
        }
    }

    onMouseMove(e) {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
    }

    onMouseDown(e) {
        if (e.button === 0) { // Left click
            this.mouse.isDown = true;
        }
    }

    onMouseUp(e) {
        if (e.button === 0) {
            this.mouse.isDown = false;
        }
    }

    getMouseWorld(camera) {
        if (!camera) return this.mouse;
        return {
            x: this.mouse.x + camera.x,
            y: this.mouse.y + camera.y,
            isDown: this.mouse.isDown
        };
    }

    getMouseGrid(camera, tileSize) {
        const world = this.getMouseWorld(camera);
        return {
            col: Math.floor(world.x / tileSize),
            row: Math.floor(world.y / tileSize)
        };
    }

    getMovementVector() {
        let x = 0;
        let y = 0;

        if (this.keys.w) y -= 1;
        if (this.keys.s) y += 1;
        if (this.keys.a) x -= 1;
        if (this.keys.d) x += 1;

        // Normalize if moving diagonally
        if (x !== 0 && y !== 0) {
            const length = Math.sqrt(x * x + y * y);
            x /= length;
            y /= length;
        }

        return { x, y };
    }
}
