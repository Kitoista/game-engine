import { Collider } from "../components";
import { Rectangle } from "../engine";
import { GameObject } from "../game-object";

export const wallPrefab = (transform: Rectangle): GameObject => {
    const re = new GameObject();
    re.transform = new Rectangle(transform);
    re.collisionLayer = 0;
    const collider = re.addComponent(Collider);
    return re;
}
