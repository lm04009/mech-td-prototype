export class Collision {
    // Check if Circle overlaps with Rectangle (AABB)
    static checkCircleRect(circle, rect) {
        // Find the closest point on the rectangle to the circle center
        let closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
        let closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));

        // Calculate the distance between the circle center and this closest point
        let distanceX = circle.x - closestX;
        let distanceY = circle.y - closestY;

        // If the distance is less than the circle's radius, an intersection occurs
        let distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
        return distanceSquared < (circle.radius * circle.radius);
    }

    // Check if two Circles overlap
    static checkCircleCircle(c1, c2) {
        let dx = c1.x - c2.x;
        let dy = c1.y - c2.y;
        let distanceSquared = dx * dx + dy * dy;
        let radiusSum = c1.radius + c2.radius;
        return distanceSquared < (radiusSum * radiusSum);
    }

    // Advanced: Get separation vector for Circle vs Rect
    // Returns {x, y} to push circle out of rect, or null if no collision
    static resolveCircleRect(circle, rect) {
        // Find closest point on rect to circle center
        let closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
        let closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));

        let dx = circle.x - closestX;
        let dy = circle.y - closestY;
        let distSq = dx * dx + dy * dy;

        // No collision
        if (distSq >= circle.radius * circle.radius) return null;

        // If circle center is inside rect, closest point is center itself (distSq is 0)
        // Need special handling to push out to nearest edge
        if (distSq === 0) {
            // Find distance to each edge
            let overlapL = circle.x - rect.x + circle.radius;
            let overlapR = (rect.x + rect.width) - circle.x + circle.radius;
            let overlapT = circle.y - rect.y + circle.radius;
            let overlapB = (rect.y + rect.height) - circle.y + circle.radius;

            // Find minimum overlap
            let minOverlap = Math.min(overlapL, overlapR, overlapT, overlapB);

            if (minOverlap === overlapL) return { x: -minOverlap, y: 0 };
            if (minOverlap === overlapR) return { x: minOverlap, y: 0 };
            if (minOverlap === overlapT) return { x: 0, y: -minOverlap };
            if (minOverlap === overlapB) return { x: 0, y: minOverlap };
        }

        let dist = Math.sqrt(distSq);
        let overlap = circle.radius - dist;

        // Normal vector from closest point to circle center
        let nx = dx / dist;
        let ny = dy / dist;

        return { x: nx * overlap, y: ny * overlap };
    }

    // Advanced: Get separation vector for Circle vs Circle
    static resolveCircleCircle(c1, c2) {
        let dx = c1.x - c2.x;
        let dy = c1.y - c2.y;
        let distSq = dx * dx + dy * dy;
        let radiusSum = c1.radius + c2.radius;

        if (distSq >= radiusSum * radiusSum) return null;

        let dist = Math.sqrt(distSq);

        // Prevent division by zero if centers are identical
        if (dist === 0) {
            return { x: radiusSum, y: 0 }; // Arbitrary push
        }

        let overlap = radiusSum - dist;
        let nx = dx / dist;
        let ny = dy / dist;

        return { x: nx * overlap, y: ny * overlap };
    }
}
