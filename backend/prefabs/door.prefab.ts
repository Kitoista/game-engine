import { Collider, Door, Rigidbody, SpriteRenderer } from "../common/components";
import { Rectangle, Vector } from "../common/engine";
import { GameObject } from "../common/game-object";


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
