export class InputHandler {
    constructor(canvas) {
        this.keys = {
            '1': false,
            '2': false,
            '3': false,
        };

        // Mouse State
        this.mouse = { x: 0, y: 0, isDown: false, isRightDown: false };
        this.canvas = canvas;

        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));

        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('mousedown', (e) => this.onMouseDown(e));
        window.addEventListener('mouseup', (e) => this.onMouseUp(e));
        window.addEventListener('contextmenu', (e) => e.preventDefault()); // Suppress RMB context menu
    }

    onKeyDown(e) {
        const key = e.key.toLowerCase();
        // Handle digit keys '1', '2', '3' before toLowerCase mapping
        if (['1', '2', '3'].includes(e.key) && this.keys.hasOwnProperty(e.key)) {
            this.keys[e.key] = true;
            return;
        }
        if (this.keys.hasOwnProperty(key)) {
            this.keys[key] = true;
        }
    }

    onKeyUp(e) {
        const key = e.key.toLowerCase();
        if (['1', '2', '3'].includes(e.key) && this.keys.hasOwnProperty(e.key)) {
            this.keys[e.key] = false;
            return;
        }
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
        if (e.button === 0) {
            this.mouse.isDown = true;
        }
        if (e.button === 2) {
            this.mouse.isRightDown = true;
        }
    }

    onMouseUp(e) {
        if (e.button === 0) {
            this.mouse.isDown = false;
        }
        if (e.button === 2) {
            this.mouse.isRightDown = false;
        }
    }

    getMouseWorld(camera) {
        if (!camera) return this.mouse;
        return {
            x: this.mouse.x + camera.x,
            y: this.mouse.y + camera.y,
            isDown: this.mouse.isDown,
            isRightDown: this.mouse.isRightDown
        };
    }

    getMouseGrid(camera, tileSize) {
        const world = this.getMouseWorld(camera);
        return {
            col: Math.floor(world.x / tileSize),
            row: Math.floor(world.y / tileSize)
        };
    }

    getWeaponInputState() {
        return {
            isRightDown: this.mouse.isRightDown,
            key1: this.keys['1'],
            key2: this.keys['2'],
            key3: this.keys['3'],
        };
    }
}
