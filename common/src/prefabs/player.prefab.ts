import { Player, Rigidbody, SpriteRenderer } from "../components";
import { Animator } from "../components/animator";
import { Collider } from "../components/collider";
import { Rectangle } from "../engine";
import { GameObject } from "../game-object";

export const playerPrefab = (): GameObject => {
    const playerObject = new GameObject();
    playerObject.transform = new Rectangle(250, 250, 50, 50);
    playerObject.collisionLayer = 1;
    
    const collider = playerObject.addComponent(Collider);
    const rigidbody = playerObject.addComponent(Rigidbody);
    const spriteRenderer = playerObject.addComponent(SpriteRenderer);
    const animator = playerObject.addComponent(Animator);
    const player = playerObject.addComponent(Player);
    const trigger = playerObject.addComponent(Collider);

    collider.bounds.dimension.height = 20;
    collider.bounds.dimension.width = 40;
    collider.bounds.position.x = 5;
    collider.bounds.position.y = 30;

    spriteRenderer.affectedByVision = true;

    animator.animationMap = {
        'idle': [
            { sprite: { name: 'Ebisu1' }, duration: 1000 },
            { sprite: { name: 'Ebisu2' }, duration: 1000 },
        ]
    }
    animator.name = 'idle';

    trigger.bounds.position.x -= 5;
    trigger.bounds.position.y -= 5;
    trigger.bounds.dimension.width += 10;
    trigger.bounds.dimension.height += 10;
    trigger.isTrigger = true;

    return playerObject;
}
