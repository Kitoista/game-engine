import { Collider, SpriteRenderer } from "../common/components";
import { Rectangle } from "../common/engine";
import { GameObject } from "../common/game-object";

export const wallPrefab = (transform: Rectangle): GameObject => {
    const re = new GameObject();
    re.transform = new Rectangle(transform);
    re.collisionLayer = 0;

    const collider = re.addComponent(Collider);
    const spriteRenderer = re.addComponent(SpriteRenderer);

    collider.bounds.position.y += 20;
    collider.bounds.dimension.height -= 20;
    return re;
}
