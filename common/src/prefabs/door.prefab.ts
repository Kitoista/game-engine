import { Collider, Rigidbody, SpriteRenderer } from "../components";
import { Door } from "../components/door";
import { Rectangle, Vector } from "../engine";
import { GameObject } from "../game-object";

export const doorPrefab = (transform: Rectangle, openedPosition: Vector): GameObject => {
    const re = new GameObject();
    re.transform = new Rectangle(transform);
    re.collisionLayer = 0;
    const collider = re.addComponent(Collider);
    const rigidbody = re.addComponent(Rigidbody);
    const door = re.addComponent(Door);
    const trigger = re.addComponent(Collider);
    const spriteRenderer = re.addComponent(SpriteRenderer);

    door.openedPosition = openedPosition;
    
    trigger.bounds.position.x -= 50;
    trigger.bounds.position.y -= 10;
    trigger.bounds.dimension.width += 100;
    trigger.bounds.dimension.height += 20;
    trigger.isTrigger = true;
    trigger.isStatic = true;
    trigger.bounds.offset(transform.position);
    return re;
}
