export class Camera {
    constructor(mapWidth, mapHeight, viewportWidth, viewportHeight) {
        this.x = 0;
        this.y = 0;
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
        this.viewportWidth = viewportWidth;
        this.viewportHeight = viewportHeight;
    }

    follow(target) {
        // Center on target
        this.x = target.x - this.viewportWidth / 2;
        this.y = target.y - this.viewportHeight / 2;

        // Clamp to map bounds
        this.x = Math.max(0, Math.min(this.x, this.mapWidth - this.viewportWidth));
        this.y = Math.max(0, Math.min(this.y, this.mapHeight - this.viewportHeight));
    }

    resize(viewportWidth, viewportHeight) {
        this.viewportWidth = viewportWidth;
        this.viewportHeight = viewportHeight;
    }
}
