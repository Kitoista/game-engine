import { Collider, SpriteRenderer } from "../components";
import { Rectangle } from "../engine";
import { GameObject } from "../game-object";

export const wallPrefab = (transform: Rectangle): GameObject => {
    const re = new GameObject();
    re.transform = new Rectangle(transform);
    re.collisionLayer = 0;

    const collider = re.addComponent(Collider);
    const spriteRenderer = re.addComponent(SpriteRenderer);

    collider.bounds.position.y += 40;
    collider.bounds.dimension.height -= 40;
    return re;
}
